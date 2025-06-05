import type { TransactionalDB } from '@repo/base-repo';
import { ValidationError } from '../../shared/errors';
import { FloorSeats, SeatType } from '../../shared/types';
import { busDiagramModelRepository } from '../bus-diagram-models/bus-diagram-models.repository';
import { busSeatModels } from './bus-seat-models.schema';
import { CreateBusSeatModelPayload } from './bus-seat-models.types';
import { busSeatModelRepository } from './bus-seat-models.repository';

// Constants for default values
const DEFAULT_NUM_ROWS = 10;
const DEFAULT_SEAT_TYPE = SeatType.REGULAR;
const DEFAULT_AMENITIES: string[] = [];
const DEFAULT_RECLINEMENT_ANGLE = 120;
const DEFAULT_IS_ACTIVE = true;
const INITIAL_SEAT_NUMBER_COUNTER = 1;

// Domain-specific error messages
const BUS_SEAT_MODEL_ERRORS = {
  INVALID_FLOOR_CONFIG: 'Invalid seatsPerFloor configuration',
} as const;

/**
 * Creates the bus seat model use cases
 * @returns Object with use case functions
 */
export function createBusSeatModelUseCases() {
  /**
   * Gets floor seat configuration or provides defaults
   * @param seatsPerFloor - The seatsPerFloor array from the bus diagram model
   * @param floorNum - The floor number to get configuration for
   * @returns FloorSeats with configuration for the specified floor
   */
  function getFloorConfig(
    seatsPerFloor: FloorSeats[],
    floorNum: number,
  ): FloorSeats {
    // Try to find floor-specific configuration
    const config = seatsPerFloor.find(
      (config) => config.floorNumber === floorNum,
    );
    if (!config) {
      // Return default configuration if not found
      return {
        floorNumber: floorNum,
        numRows: DEFAULT_NUM_ROWS,
        seatsLeft: 2,
        seatsRight: 2,
      };
    }
    return config;
  }

  /**
   * Creates seat model payload for storing in the database
   * @param busDiagramModelId - Bus diagram model ID
   * @param seatNumber - Seat number
   * @param floorNumber - Floor number
   * @param rowIndex - Row index (0-based)
   * @param colIndex - Column index (0-based)
   * @param rowLength - Total length of the row
   * @returns CreateBusSeatModelPayload object
   */
  function createSeatModelPayload(
    busDiagramModelId: number,
    seatNumber: string,
    floorNumber: number,
    rowIndex: number,
    colIndex: number,
    rowLength: number,
  ): CreateBusSeatModelPayload {
    const rowNumber = rowIndex + 1; // Convert to 1-based row number

    return {
      busDiagramModelId,
      seatNumber,
      floorNumber,
      seatType: DEFAULT_SEAT_TYPE,
      amenities: DEFAULT_AMENITIES,
      position: {
        x: colIndex,
        y: rowNumber,
      },
      meta: {
        rowIndex,
        colIndex,
        isWindow: colIndex === 0 || colIndex === rowLength - 1,
        isLegroom: rowIndex === 0,
        created: new Date().toISOString(),
      },
      active: DEFAULT_IS_ACTIVE,
      reclinementAngle: DEFAULT_RECLINEMENT_ANGLE,
    };
  }

  /**
   * Generates seat model payloads for a single floor
   * @param busDiagramModelId - Bus diagram model ID
   * @param floorConfig - Floor configuration
   * @param seatNumberCounter - Current seat number counter (will be modified)
   * @returns [Array of seat model payloads, updated seat counter]
   */
  function generateFloorSeatModels(
    busDiagramModelId: number,
    floorConfig: FloorSeats,
    seatNumberCounter: number,
  ): [CreateBusSeatModelPayload[], number] {
    const seatModels: CreateBusSeatModelPayload[] = [];
    let currentSeatCounter = seatNumberCounter;

    // Calculate total width of row (left seats + aisle + right seats)
    const rowWidth = floorConfig.seatsLeft + 1 + floorConfig.seatsRight;

    // Generate seats for each row
    for (let rowIndex = 0; rowIndex < floorConfig.numRows; rowIndex++) {
      // Generate left side seats
      for (let leftSeat = 0; leftSeat < floorConfig.seatsLeft; leftSeat++) {
        const seatNumber = String(currentSeatCounter++);
        const colIndex = leftSeat;

        seatModels.push(
          createSeatModelPayload(
            busDiagramModelId,
            seatNumber,
            floorConfig.floorNumber,
            rowIndex,
            colIndex,
            rowWidth,
          ),
        );
      }

      // Skip the aisle (middle position)
      // Generate right side seats
      for (let rightSeat = 0; rightSeat < floorConfig.seatsRight; rightSeat++) {
        const seatNumber = String(currentSeatCounter++);
        const colIndex = floorConfig.seatsLeft + 1 + rightSeat; // +1 for aisle

        seatModels.push(
          createSeatModelPayload(
            busDiagramModelId,
            seatNumber,
            floorConfig.floorNumber,
            rowIndex,
            colIndex,
            rowWidth,
          ),
        );
      }
    }

    return [seatModels, currentSeatCounter];
  }

  /**
   * Creates seat models from a bus diagram model configuration within a transaction
   * This method is designed to be called from within an existing transaction to ensure
   * atomicity with other operations (e.g., creating the bus diagram model itself).
   *
   * @param busDiagramModelId - The ID of the bus diagram model to create seat models for
   * @param tx - Transaction context to ensure atomicity with other operations
   * @returns {Promise<number>} The number of seat models created
   * @throws {ValidationError} If the floor configuration is invalid
   * @throws {NotFoundError} If the bus diagram model is not found
   */
  async function createSeatModelsFromDiagramModel(
    busDiagramModelId: number,
    tx: TransactionalDB,
  ): Promise<number> {
    // Create transaction-scoped repositories
    const txSeatRepo = busSeatModelRepository.withTransaction(tx);
    const txDiagramRepo = busDiagramModelRepository.withTransaction(tx);

    // Get the bus diagram model using transaction-scoped repository
    const diagramModel = await txDiagramRepo.findOne(busDiagramModelId);
    const seatsPerFloor = diagramModel.seatsPerFloor as FloorSeats[];
    const allSeatModels: CreateBusSeatModelPayload[] = [];
    let seatNumberCounter = INITIAL_SEAT_NUMBER_COUNTER;

    // Generate seat models for each floor
    for (let floorNum = 1; floorNum <= diagramModel.numFloors; floorNum++) {
      const floorConfig = getFloorConfig(seatsPerFloor, floorNum);

      const [floorSeatModels, updatedCounter] = generateFloorSeatModels(
        busDiagramModelId,
        floorConfig,
        seatNumberCounter,
      );

      allSeatModels.push(...floorSeatModels);
      seatNumberCounter = updatedCounter;
    }

    // Create all seat models using the transaction-scoped repository
    if (allSeatModels.length > 0) {
      const createdSeatModels = await Promise.all(
        allSeatModels.map(
          async (seatModelData) => await txSeatRepo.create(seatModelData),
        ),
      );
      return createdSeatModels.length;
    } else {
      throw new ValidationError(BUS_SEAT_MODEL_ERRORS.INVALID_FLOOR_CONFIG);
    }
  }

  /**
   * Regenerates seat models for a bus diagram model
   * This will delete existing seat models and create new ones based on current configuration
   * @param busDiagramModelId - The ID of the bus diagram model
   * @returns {Promise<number>} The number of seat models created
   */
  async function regenerateSeatModels(
    busDiagramModelId: number,
  ): Promise<number> {
    return await busSeatModelRepository.transaction(async (txRepo, tx) => {
      // Use transaction-scoped repositories for all operations
      const txBusDiagramModelRepo =
        busDiagramModelRepository.withTransaction(tx);

      // Get existing seat models using transaction-scoped repository
      const existingSeatModels = await txRepo.findAllBy(
        busSeatModels.busDiagramModelId,
        busDiagramModelId,
      );

      // Delete existing seat models if any
      for (const seatModel of existingSeatModels) {
        await txRepo.delete(seatModel.id);
      }

      // Get the bus diagram model using transaction-scoped repository
      const diagramModel =
        await txBusDiagramModelRepo.findOne(busDiagramModelId);
      const seatsPerFloor = diagramModel.seatsPerFloor as FloorSeats[];
      const allSeatModels: CreateBusSeatModelPayload[] = [];
      let seatNumberCounter = INITIAL_SEAT_NUMBER_COUNTER;

      // Generate seat models for each floor
      for (let floorNum = 1; floorNum <= diagramModel.numFloors; floorNum++) {
        const floorConfig = getFloorConfig(seatsPerFloor, floorNum);

        const [floorSeatModels, updatedCounter] = generateFloorSeatModels(
          busDiagramModelId,
          floorConfig,
          seatNumberCounter,
        );

        allSeatModels.push(...floorSeatModels);
        seatNumberCounter = updatedCounter;
      }

      // Create new seat models using the transaction-scoped repository
      if (allSeatModels.length > 0) {
        const createdSeatModels = await Promise.all(
          allSeatModels.map(
            async (seatModelData) => await txRepo.create(seatModelData),
          ),
        );
        return createdSeatModels.length;
      } else {
        throw new ValidationError(BUS_SEAT_MODEL_ERRORS.INVALID_FLOOR_CONFIG);
      }
    });
  }

  return {
    createSeatModelsFromDiagramModel,
    regenerateSeatModels,
  };
}

// Export the bus seat model use cases instance
export const busSeatModelUseCases = createBusSeatModelUseCases();
