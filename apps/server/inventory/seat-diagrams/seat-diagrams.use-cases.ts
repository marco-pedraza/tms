import { FloorSeats } from '../../shared/types';
import { busSeatRepository } from '../bus-seats/bus-seats.repository';
import { BusSeat } from '../bus-seats/bus-seats.types';
import {
  Floor,
  SeatConfiguration,
  SeatDiagram,
  Space,
  SpaceType,
} from './seat-diagrams.types';
import { seatDiagramRepository } from './seat-diagrams.repository';

// Constants for default values
const DEFAULT_NUM_ROWS = 10;
const DEFAULT_SEAT_TYPE_STRING = 'regular';
const DEFAULT_AMENITIES: string[] = [];
const DEFAULT_META: Record<string, unknown> = {};
const DEFAULT_RECLINEMENT_ANGLE = 120;
const DEFAULT_ROW_NUMBER = 1;
const DEFAULT_COLUMN_NUMBER = 0;
const INITIAL_SEAT_NUMBER_COUNTER = 1;
const INITIAL_TOTAL_SEATS = 0;

/**
 * Creates the seat diagram use cases
 * @returns Object with use case functions
 */
export const createSeatDiagramUseCases = () => {
  /**
   * Gets floor seat configuration or provides defaults
   * @param seatsPerFloor - The seatsPerFloor array from the model
   * @param floorNum - The floor number to get configuration for
   * @returns FloorSeats with configuration for the specified floor
   */
  const getFloorConfig = (
    seatsPerFloor: FloorSeats[],
    floorNum: number,
  ): FloorSeats => {
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
  };

  /**
   * Creates a seat space object
   * @param seatNumber - Seat number
   * @param seatType - Type of seat
   * @param amenities - Array of amenities
   * @param meta - Additional metadata
   * @param reclinementAngle - Seat reclinement angle
   * @returns Space object representing a seat
   */
  const createSeatSpace = (
    seatNumber: string,
    seatType = DEFAULT_SEAT_TYPE_STRING,
    amenities: string[] = DEFAULT_AMENITIES,
    meta: Record<string, unknown> = DEFAULT_META,
    reclinementAngle = DEFAULT_RECLINEMENT_ANGLE,
  ): Space => {
    return {
      type: SpaceType.SEAT,
      seatNumber,
      seatType,
      amenities,
      meta,
      reclinementAngle,
    };
  };

  /**
   * Calculates the total width of a row based on floor configuration
   * @param floorConfig - Floor configuration
   * @returns Total number of spaces in a row
   */
  const calculateRowWidth = (floorConfig: FloorSeats): number => {
    return floorConfig.seatsLeft + 1 + floorConfig.seatsRight;
  };

  /**
   * Creates an empty row with hallway spaces based on floor configuration
   * @param floorConfig - Floor configuration
   * @returns Array of spaces representing an empty row
   */
  const createEmptyRow = (floorConfig: FloorSeats): Space[] => {
    const spaces: Space[] = [];

    // Create hallways for left seats
    for (let i = 0; i < floorConfig.seatsLeft; i++) {
      spaces.push({ type: SpaceType.HALLWAY });
    }

    // Add hallway in the middle
    spaces.push({ type: SpaceType.HALLWAY });

    // Add hallways for right seats
    for (let i = 0; i < floorConfig.seatsRight; i++) {
      spaces.push({ type: SpaceType.HALLWAY });
    }

    return spaces;
  };

  /**
   * Creates a regular row with seats
   * @param floorConfig - Floor configuration
   * @param seatNumberCounter - Current seat number counter (will be modified)
   * @returns [Array of spaces representing a row with seats, updated seat counter, seats added]
   */
  const createRegularRow = (
    floorConfig: FloorSeats,
    seatNumberCounter: number,
  ): [Space[], number, number] => {
    const spaces: Space[] = [];
    let seatsAdded = 0;

    // Create left seats
    for (let seatIdx = 0; seatIdx < floorConfig.seatsLeft; seatIdx++) {
      const seatNumber = String(seatNumberCounter++);
      spaces.push(createSeatSpace(seatNumber));
      seatsAdded++;
    }

    // Add hallway
    spaces.push({ type: SpaceType.HALLWAY });

    // Create right seats
    for (let seatIdx = 0; seatIdx < floorConfig.seatsRight; seatIdx++) {
      const seatNumber = String(seatNumberCounter++);
      spaces.push(createSeatSpace(seatNumber));
      seatsAdded++;
    }

    return [spaces, seatNumberCounter, seatsAdded];
  };

  /**
   * Gets the maximum row number for a floor based on its configuration
   * @param floorConfig - Floor configuration containing numRows
   * @returns Maximum row number for the floor
   */
  const getMaxRowNumber = (floorConfig: FloorSeats): number => {
    return floorConfig.numRows || DEFAULT_NUM_ROWS;
  };

  /**
   * Groups seats by y-position (row)
   * @param seats - Array of seats
   * @returns Map of rows to seat arrays
   */
  const groupSeatsByRow = (seats: BusSeat[]): Map<number, BusSeat[]> => {
    return seats.reduce((acc, seat) => {
      // Use position.y as row indicator with safe access pattern
      const y =
        seat.position?.y !== undefined ? seat.position.y : DEFAULT_ROW_NUMBER; // Default to row 1 if position not specified
      if (!acc.has(y)) {
        acc.set(y, []);
      }
      const rowSeats = acc.get(y);
      if (rowSeats) {
        rowSeats.push(seat);
      }
      return acc;
    }, new Map<number, BusSeat[]>());
  };

  /**
   * Groups seats by x-position (column)
   * @param seats - Array of seats for a single row
   * @returns Map of columns to seats
   */
  const groupSeatsByColumn = (seats: BusSeat[]): Map<number, BusSeat> => {
    return seats.reduce((acc, seat) => {
      // Use explicit safe access pattern for position.x
      const x =
        seat.position?.x !== undefined
          ? seat.position.x
          : DEFAULT_COLUMN_NUMBER;
      acc.set(x, seat);
      return acc;
    }, new Map<number, BusSeat>());
  };

  /**
   * Process row and create seats or hallways based on existing seats
   * @param rowSeats - Existing seats for this row
   * @param floorConfig - Floor configuration
   * @returns Array of spaces for the row
   */
  const createRowFromExistingSeats = (
    rowSeats: BusSeat[],
    floorConfig: FloorSeats,
  ): Space[] => {
    if (rowSeats.length === 0) {
      return createEmptyRow(floorConfig);
    }

    const spaces: Space[] = [];

    // Get seats grouped by x position
    const seatsByX = groupSeatsByColumn(rowSeats);

    // Expected total width of row
    const expectedWidth = calculateRowWidth(floorConfig);

    // Create left side of the row
    for (let x = 0; x < floorConfig.seatsLeft; x++) {
      const seat = seatsByX.get(x);
      spaces.push(
        seat
          ? createSeatSpace(
              seat.seatNumber,
              seat.seatType,
              seat.amenities || [],
              seat.meta || {},
              seat.reclinementAngle,
            )
          : { type: SpaceType.HALLWAY },
      );
    }

    // Add hallway in the middle (aisle)
    spaces.push({ type: SpaceType.HALLWAY });

    // Create right side of the row
    for (let x = floorConfig.seatsLeft + 1; x < expectedWidth; x++) {
      const seat = seatsByX.get(x);
      spaces.push(
        seat
          ? createSeatSpace(
              seat.seatNumber,
              seat.seatType,
              seat.amenities || [],
              seat.meta || {},
              seat.reclinementAngle,
            )
          : { type: SpaceType.HALLWAY },
      );
    }

    return spaces;
  };

  /**
   * Type definitions for the contexts used within floor creation
   */
  interface SeatContext {
    totalSeats: number;
    seatNumberCounter: number;
  }

  /**
   * Creates a floor with rows based on common parameters
   * @param model - Bus model
   * @param floorNum - Floor number
   * @param processRow - Callback function to process each row
   * @param seatContext - Optional context for tracking seat counts
   * @returns [Floor object with rows, updated seat context]
   */
  const createFloor = (
    model: SeatDiagram,
    floorNum: number,
    processRow: (
      rowNum: number,
      floorConfig: FloorSeats,
      context: SeatContext,
    ) => [Space[], SeatContext],
    context: SeatContext,
  ): [Floor, SeatContext] => {
    const rows: Space[][] = [];
    const seatsPerFloor = model.seatsPerFloor || [];
    const floorConfig = getFloorConfig(seatsPerFloor, floorNum);

    // Get maximum row number for this floor
    const maxRow = getMaxRowNumber(floorConfig);

    let updatedContext = { ...context };

    // Process each row
    for (let rowNum = 1; rowNum <= maxRow; rowNum++) {
      // Process this row
      const [rowSpaces, newContext] = processRow(
        rowNum,
        floorConfig,
        updatedContext,
      );
      updatedContext = newContext;

      if (rowSpaces) {
        rows.push(rowSpaces);
      }
    }

    return [
      {
        floorNumber: floorNum,
        rows,
      },
      updatedContext,
    ];
  };

  /**
   * Creates a seat configuration based on a model
   * @param model - Bus model
   * @param floorProcessorFn - Function to process each floor
   * @param initialContext - Initial context object
   * @returns Seat configuration
   */
  const createConfiguration = (
    model: SeatDiagram,
    floorProcessorFn: (
      floorNum: number,
      context: SeatContext,
    ) => [Floor, SeatContext],
    initialContext: SeatContext,
  ): SeatConfiguration => {
    const floors: Floor[] = [];
    let context = { ...initialContext };

    // Process each floor
    for (let floorNum = 1; floorNum <= model.numFloors; floorNum++) {
      const [floor, newContext] = floorProcessorFn(floorNum, context);
      floors.push(floor);
      context = newContext;
    }

    return {
      floors,
      totalSeats: context.totalSeats,
    };
  };

  /**
   * Builds a seat configuration for a seat diagram
   * If there are seats already created for this diagram, it will use them
   * Otherwise, it will generate a theoretical layout based on diagram parameters
   * @param id - The ID of the seat diagram
   * @returns {Promise<SeatConfiguration>} The seat configuration
   */
  const buildSeatConfiguration = async (
    id: number,
  ): Promise<SeatConfiguration> => {
    // First, find the seat diagram
    const diagram = await seatDiagramRepository.findOne(id);

    // Check if there are already seats created for this diagram
    const existingSeatsResult =
      await busSeatRepository.findAllBySeatDiagram(id);
    const existingSeats = existingSeatsResult.busSeats;

    if (existingSeats.length > 0) {
      // If there are existing seats, get configuration from them
      return getConfigurationFromExistingSeats(diagram, existingSeats);
    } else {
      // Otherwise, generate a theoretical layout
      const result = buildTheoreticalConfiguration(diagram);
      return result;
    }
  };

  /**
   * Gets seat configuration from existing seat data
   * @param model - The bus model
   * @param seats - The existing seats
   * @returns {SeatConfiguration} The seat configuration
   */
  const getConfigurationFromExistingSeats = (
    model: SeatDiagram,
    seats: BusSeat[],
  ): SeatConfiguration => {
    // Group seats by floor number
    const seatsByFloor = seats.reduce((acc, seat) => {
      const floorNum = seat.floorNumber;
      if (!acc.has(floorNum)) {
        acc.set(floorNum, []);
      }
      const floorSeats = acc.get(floorNum);
      if (floorSeats) {
        floorSeats.push(seat);
      }
      return acc;
    }, new Map<number, BusSeat[]>());

    // Create a function to process each floor for existing seats
    const processFloor = (
      floorNum: number,
      context: SeatContext,
    ): [Floor, SeatContext] => {
      const floorSeats = seatsByFloor.get(floorNum) || [];
      const seatsByY = groupSeatsByRow(floorSeats);
      const rowNumbers = Array.from(seatsByY.keys());
      const maxRowNum = rowNumbers.length > 0 ? Math.max(...rowNumbers) : 0;

      // Create a function to process each row for existing seats
      const processRow = (
        rowNum: number,
        floorConfig: FloorSeats,
        context: SeatContext,
      ): [Space[], SeatContext] => {
        // For regular rows, create a row with seats or hallways
        const rowSeats = seatsByY.get(rowNum) ?? [];
        const floorNumRows = floorConfig?.numRows || DEFAULT_NUM_ROWS;

        // Check if this row should exist
        if (
          rowSeats.length === 0 &&
          rowNum > maxRowNum &&
          rowNum > floorNumRows
        ) {
          return [[], context]; // Skip this row
        }

        return [createRowFromExistingSeats(rowSeats, floorConfig), context];
      };

      return createFloor(model, floorNum, processRow, context);
    };

    return createConfiguration(model, processFloor, {
      totalSeats: seats.length,
      seatNumberCounter: INITIAL_SEAT_NUMBER_COUNTER,
    });
  };

  /**
   * Builds a theoretical seat configuration based on model parameters
   * @param model - The bus model
   * @returns {SeatConfiguration} The theoretical seat configuration
   */
  const buildTheoreticalConfiguration = (
    model: SeatDiagram,
  ): SeatConfiguration => {
    // Create a function to process each floor for theoretical configuration
    const processFloor = (
      floorNum: number,
      context: SeatContext,
    ): [Floor, SeatContext] => {
      // Create a function to process each row for theoretical configuration
      const processRow = (
        rowNum: number,
        floorConfig: FloorSeats,
        context: SeatContext,
      ): [Space[], SeatContext] => {
        if (rowNum <= (floorConfig?.numRows || DEFAULT_NUM_ROWS)) {
          // For regular rows within the row count, create a regular row with seats
          const [rowSpaces, newSeatCounter, seatsAdded] = createRegularRow(
            floorConfig,
            context.seatNumberCounter,
          );

          // Update our context with the new seat counter and total seats
          const updatedContext = {
            totalSeats: context.totalSeats + seatsAdded,
            seatNumberCounter: newSeatCounter,
          };

          return [rowSpaces, updatedContext];
        }

        return [[], context]; // Skip other rows
      };

      return createFloor(model, floorNum, processRow, context);
    };

    return createConfiguration(model, processFloor, {
      totalSeats: INITIAL_TOTAL_SEATS,
      seatNumberCounter: INITIAL_SEAT_NUMBER_COUNTER,
    });
  };

  return {
    buildSeatConfiguration,
    buildTheoreticalConfiguration,
  };
};

// Export the seat diagram use cases instance
export const seatDiagramUseCases = createSeatDiagramUseCases();
