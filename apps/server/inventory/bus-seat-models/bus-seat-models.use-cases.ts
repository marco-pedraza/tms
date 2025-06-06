import type { TransactionalDB } from '@repo/base-repo';
import { SpaceType } from '../../shared/types';
import { busDiagramModelRepository } from '../bus-diagram-models/bus-diagram-models.repository';
import type { BusDiagramModel } from '../bus-diagram-models/bus-diagram-models.types';
import { busSeatModels } from './bus-seat-models.schema';
import {
  BusSeatModel,
  SeatConfigurationInput,
  UpdatedSeatConfiguration,
} from './bus-seat-models.types';
import { busSeatModelRepository } from './bus-seat-models.repository';
import {
  createNewSeatPayload,
  createPositionKey,
  createSeatUpdateData,
  generateAllSeatModels,
  needsSeatUpdate,
  validateSeatConfigurationPayload,
} from './bus-seat-models.domain';

/**
 * Creates the bus seat model use cases
 * @returns Object with use case functions
 */
export function createBusSeatModelUseCases() {
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
    // Create transaction-scoped repository for diagram models
    const txDiagramRepo = busDiagramModelRepository.withTransaction(tx);

    // Get the bus diagram model using transaction-scoped repository
    const diagramModel = await txDiagramRepo.findOne(busDiagramModelId);

    // Generate all seat models using the domain function
    const allSeatModels = generateAllSeatModels(
      diagramModel,
      busDiagramModelId,
    );

    // Create all seat models using batch insert for better performance
    const createdSeatModels = await tx
      .insert(busSeatModels)
      .values(allSeatModels)
      .returning();

    return createdSeatModels.length;
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

      // Generate all seat models using the domain function
      const allSeatModels = generateAllSeatModels(
        diagramModel,
        busDiagramModelId,
      );

      // Create new seat models using batch insert for better performance
      const createdSeatModels = await tx
        .insert(busSeatModels)
        .values(allSeatModels)
        .returning();

      return createdSeatModels.length;
    });
  }

  /**
   * Processes a single incoming seat configuration (create or update)
   * @param incomingSeat - Incoming seat configuration
   * @param existingSeat - Existing seat model (if any)
   * @param busDiagramModelId - Bus diagram model ID
   * @param diagramModel - Bus diagram model for meta calculations
   * @param txRepo - Transaction repository
   * @returns Promise with processing result
   */
  async function processIncomingSeatConfiguration(
    incomingSeat: SeatConfigurationInput & { seatKey: string },
    existingSeat: BusSeatModel | undefined,
    busDiagramModelId: number,
    diagramModel: BusDiagramModel,
    txRepo: ReturnType<typeof busSeatModelRepository.withTransaction>,
  ): Promise<{ created: boolean; updated: boolean }> {
    if (!existingSeat) {
      // Create new space (seat, stairs, hallway, etc.)
      const newSeatPayload = createNewSeatPayload(
        incomingSeat,
        busDiagramModelId,
        diagramModel,
      );
      await txRepo.create(newSeatPayload);
      return { created: true, updated: false };
    } else {
      // Check if update is needed using the helper function
      const incomingSpaceType = incomingSeat.spaceType ?? SpaceType.SEAT;
      const needsUpdate = needsSeatUpdate(
        incomingSpaceType,
        incomingSeat,
        existingSeat,
      );

      if (needsUpdate) {
        const updateData = createSeatUpdateData(
          incomingSpaceType,
          incomingSeat,
          existingSeat,
          diagramModel,
        );

        await txRepo.update(existingSeat.id, updateData);
        return { created: false, updated: true };
      }

      return { created: false, updated: false };
    }
  }

  /**
   * Deactivates seats that are not present in the incoming configuration
   * @param existingSeats - Array of existing seat models
   * @param incomingSeatKeys - Set of position keys from incoming configuration
   * @param txRepo - Transaction repository
   * @returns Promise with number of seats deactivated
   */
  async function deactivateUnusedSeats(
    existingSeats: BusSeatModel[],
    incomingSeatKeys: Set<string>,
    txRepo: ReturnType<typeof busSeatModelRepository.withTransaction>,
  ): Promise<number> {
    let seatsDeactivated = 0;

    for (const existingSeat of existingSeats) {
      const key = createPositionKey(
        existingSeat.floorNumber,
        existingSeat.position,
      );
      if (!incomingSeatKeys.has(key) && existingSeat.active) {
        await txRepo.update(existingSeat.id, { active: false });
        seatsDeactivated++;
      }
    }

    return seatsDeactivated;
  }

  /**
   * Updates seat configuration of a template seat layout in a single batch operation
   * @param busDiagramModelId - The ID of the bus diagram model to update
   * @param seatConfigurations - Array of seat configurations to process
   * @returns Promise with statistics about the update operation
   * @throws {ValidationError} If validation fails
   */
  async function batchUpdateSeatConfiguration(
    busDiagramModelId: number,
    seatConfigurations: SeatConfigurationInput[],
  ): Promise<UpdatedSeatConfiguration> {
    return await busSeatModelRepository.transaction(async (txRepo, tx) => {
      // Create transaction-scoped repositories
      const txDiagramRepo = busDiagramModelRepository.withTransaction(tx);

      // Validate bus diagram model exists
      const diagramModel = await txDiagramRepo.findOne(busDiagramModelId);

      // Get existing seat models
      const existingSeats = await txRepo.findAllBy(
        busSeatModels.busDiagramModelId,
        busDiagramModelId,
      );

      // Validate payload including position limits
      validateSeatConfigurationPayload(seatConfigurations, diagramModel);

      // Create lookup maps for processing
      const existingSeatMap = new Map<string, BusSeatModel>();
      existingSeats.forEach((seat) => {
        const key = createPositionKey(seat.floorNumber, seat.position);
        existingSeatMap.set(key, seat);
      });

      // Build incoming seat map for processing
      const incomingSeatKeys = new Set<string>();
      const incomingSeats = seatConfigurations.map((config) => {
        const key = createPositionKey(config.floorNumber, config.position);
        incomingSeatKeys.add(key);

        return { ...config, seatKey: key };
      });

      let seatsCreated = 0;
      let seatsUpdated = 0;

      // Process each incoming seat configuration
      for (const incomingSeat of incomingSeats) {
        const existingSeat = existingSeatMap.get(incomingSeat.seatKey);

        const result = await processIncomingSeatConfiguration(
          incomingSeat,
          existingSeat,
          busDiagramModelId,
          diagramModel,
          txRepo,
        );

        if (result.created) seatsCreated++;
        if (result.updated) seatsUpdated++;
      }

      // Deactivate seats not in payload
      const seatsDeactivated = await deactivateUnusedSeats(
        existingSeats,
        incomingSeatKeys,
        txRepo,
      );

      // Update diagram model with new total seats count (only SEAT space types)
      const totalActiveSeats = await txRepo.countAll({
        filters: {
          busDiagramModelId,
          active: true,
          spaceType: SpaceType.SEAT,
        },
      });

      await txDiagramRepo.update(diagramModel.id, {
        totalSeats: totalActiveSeats,
      });

      return {
        seatsCreated,
        seatsUpdated,
        seatsDeactivated,
        totalActiveSeats,
      };
    });
  }

  return {
    createSeatModelsFromDiagramModel,
    regenerateSeatModels,
    batchUpdateSeatConfiguration,
  };
}

// Export the bus seat model use cases instance
export const busSeatModelUseCases = createBusSeatModelUseCases();
