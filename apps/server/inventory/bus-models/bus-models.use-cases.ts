import {
  BusModel,
  SeatConfiguration,
  Floor,
  Space,
  SpaceType,
  FloorSeats,
  BathroomLocation,
} from './bus-models.types';
import { busModelRepository } from './bus-models.repository';
import { busSeatRepository } from '../bus-seats/bus-seats.repository';
import { CreateBusSeatPayload, SeatType } from '../bus-seats/bus-seats.types';

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
const DEFAULT_SEAT_FLOOR_PREFIX = 'Floor ';
const DEFAULT_IS_ACTIVE = true;

/**
 * Creates the bus model use cases
 * @returns Object with use case functions
 */
export const createBusModelUseCases = () => {
  /**
   * Checks if a row is a bathroom row
   * @param bathroomRows - Array of bathroom locations
   * @param floorNum - Current floor number
   * @param rowNum - Current row number
   * @returns boolean indicating if the row is a bathroom row
   */
  const isBathroomRow = (
    bathroomRows: BathroomLocation[],
    floorNum: number,
    rowNum: number,
  ): boolean => {
    return bathroomRows.some(
      (location) =>
        location.floorNumber === floorNum && location.rowNumber === rowNum,
    );
  };

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
    return seatsPerFloor.find((config) => config.floorNumber === floorNum);
  };

  /**
   * Creates a bathroom row with appropriate spacing
   * @param totalSpaces - Total number of spaces in the row
   * @returns Array of spaces representing a bathroom row
   */
  const createBathroomRow = (totalSpaces: number): Space[] => {
    const bathroomRow: Space[] = [];
    const middlePosition = Math.floor(totalSpaces / 2);

    // Fill with hallway spaces before the bathroom
    for (let i = 0; i < middlePosition; i++) {
      bathroomRow.push({ type: SpaceType.HALLWAY });
    }

    // Add the bathroom
    bathroomRow.push({ type: SpaceType.BATHROOM });

    // Fill with hallway spaces after the bathroom
    for (let i = middlePosition + 1; i < totalSpaces; i++) {
      bathroomRow.push({ type: SpaceType.HALLWAY });
    }

    return bathroomRow;
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
   * Find maximum row number for a floor
   * @param bathrooms - Array of bathroom locations
   * @param floorNum - Current floor number
   * @param defaultRowCount - Default row count
   * @returns Maximum row number
   */
  const findMaxRowNumber = (
    bathrooms: BathroomLocation[],
    floorNum: number,
    defaultRowCount: number,
  ): number => {
    const maxBathroomRow = bathrooms
      .filter((br) => br.floorNumber === floorNum)
      .reduce((max, br) => Math.max(max, br.rowNumber), 0);

    // Use the provided defaultRowCount which comes from floorConfig.numRows or the default
    return Math.max(maxBathroomRow, defaultRowCount);
  };

  /**
   * Groups seats by y-position (row)
   * @param seats - Array of seats
   * @returns Map of rows to seat arrays
   */
  const groupSeatsByRow = (seats: unknown[]): Map<number, unknown[]> => {
    return seats.reduce((acc, seat) => {
      // Use position.y as row indicator
      const y = seat.position?.y || DEFAULT_ROW_NUMBER; // Default to row 1 if position not specified
      if (!acc.has(y)) {
        acc.set(y, []);
      }
      acc.get(y).push(seat);
      return acc;
    }, new Map<number, unknown[]>());
  };

  /**
   * Groups seats by x-position (column)
   * @param seats - Array of seats for a single row
   * @returns Map of columns to seats
   */
  const groupSeatsByColumn = (seats: unknown[]): Map<number, unknown> => {
    return seats.reduce((acc, seat) => {
      const x = seat.position?.x || DEFAULT_COLUMN_NUMBER;
      acc.set(x, seat);
      return acc;
    }, new Map<number, unknown>());
  };

  /**
   * Process row and create seats or hallways based on existing seats
   * @param rowSeats - Existing seats for this row
   * @param floorConfig - Floor configuration
   * @returns Array of spaces for the row
   */
  const createRowFromExistingSeats = (
    rowSeats: unknown[],
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
    model: BusModel,
    floorNum: number,
    processRow: (
      rowNum: number,
      floorNum: number,
      hasBathroom: boolean,
      floorConfig: FloorSeats,
      context: SeatContext,
    ) => [Space[], SeatContext],
    context: SeatContext,
  ): [Floor, SeatContext] => {
    const rows: Space[][] = [];
    const seatsPerFloor = model.seatsPerFloor || [];
    const floorConfig = getFloorConfig(seatsPerFloor, floorNum);

    const rowCount = floorConfig.numRows || DEFAULT_NUM_ROWS;

    // Find maximum row number
    const maxRow = findMaxRowNumber(
      model.bathroomRows || [],
      floorNum,
      rowCount,
    );

    let updatedContext = { ...context };

    // Process each row
    for (let rowNum = 1; rowNum <= maxRow; rowNum++) {
      // Check if this is a bathroom row
      const hasBathroom = isBathroomRow(
        model.bathroomRows || [],
        floorNum,
        rowNum,
      );

      // Process this row
      const [rowSpaces, newContext] = processRow(
        rowNum,
        floorNum,
        hasBathroom,
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
    model: BusModel,
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
      amenities: model.amenities,
      totalSeats: context.totalSeats,
    };
  };

  /**
   * Builds a seat configuration for a bus model
   * If there are seats already created for this model, it will use them
   * Otherwise, it will generate a theoretical layout based on model parameters
   * @param id - The ID of the bus model
   * @returns {Promise<SeatConfiguration>} The seat configuration
   */
  const buildSeatConfiguration = async (
    id: number,
  ): Promise<SeatConfiguration> => {
    // First, find the bus model
    const model = await busModelRepository.findOne(id);

    // Check if there are already seats created for this model
    const existingSeatsResult = await busSeatRepository.findAllByModel(id);
    const existingSeats = existingSeatsResult.busSeats;

    if (existingSeats.length > 0) {
      // If there are existing seats, get configuration from them
      return getConfigurationFromExistingSeats(model, existingSeats);
    } else {
      // Otherwise, generate a theoretical layout
      const result = buildTheoreticalConfiguration(model);
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
    model: BusModel,
    seats: unknown[],
  ): SeatConfiguration => {
    // Group seats by floor number
    const seatsByFloor = seats.reduce((acc, seat) => {
      const floorNum = seat.floorNumber;
      if (!acc.has(floorNum)) {
        acc.set(floorNum, []);
      }
      acc.get(floorNum).push(seat);
      return acc;
    }, new Map<number, unknown[]>());

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
        floorNum: number,
        hasBathroom: boolean,
        floorConfig: FloorSeats,
        context: SeatContext,
      ): [Space[], SeatContext] => {
        if (hasBathroom) {
          // For bathroom rows, create a bathroom row
          return [createBathroomRow(calculateRowWidth(floorConfig)), context];
        } else {
          // For regular rows, create a row with seats or hallways
          const rowSeats = seatsByY.get(rowNum) ?? [];
          const floorNumRows = floorConfig?.numRows || DEFAULT_NUM_ROWS;

          // Check if this row should exist
          if (
            rowSeats.length === 0 &&
            rowNum > maxRowNum &&
            rowNum > floorNumRows
          ) {
            return [null, context]; // Skip this row
          }

          return [createRowFromExistingSeats(rowSeats, floorConfig), context];
        }
      };

      return createFloor(model, floorNum, processRow, context);
    };

    return createConfiguration(model, processFloor, {
      totalSeats: seats.length,
      seatNumberCounter: INITIAL_SEAT_NUMBER_COUNTER, // Using constant but value is driven by existing seats, could be misleading? Let's keep it for now.
    });
  };

  /**
   * Builds a theoretical seat configuration based on model parameters
   * @param model - The bus model
   * @returns {SeatConfiguration} The theoretical seat configuration
   */
  const buildTheoreticalConfiguration = (
    model: BusModel,
  ): SeatConfiguration => {
    // Create a function to process each floor for theoretical configuration
    const processFloor = (
      floorNum: number,
      context: SeatContext,
    ): [Floor, SeatContext] => {
      // Create a function to process each row for theoretical configuration
      const processRow = (
        rowNum: number,
        floorNum: number,
        hasBathroom: boolean,
        floorConfig: FloorSeats,
        context: SeatContext,
      ): [Space[], SeatContext] => {
        if (hasBathroom) {
          // For bathroom rows, create a bathroom row
          return [createBathroomRow(calculateRowWidth(floorConfig)), context];
        } else if (rowNum <= (floorConfig?.numRows || DEFAULT_NUM_ROWS)) {
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

        return [null, context]; // Skip other rows
      };

      return createFloor(model, floorNum, processRow, context);
    };

    return createConfiguration(model, processFloor, {
      totalSeats: INITIAL_TOTAL_SEATS,
      seatNumberCounter: INITIAL_SEAT_NUMBER_COUNTER,
    });
  };

  /**
   * Collects all seat spaces from a configuration
   * @param configuration - The seat configuration to extract seats from
   * @returns Array of collected seat spaces with floor, row, and position information
   */
  const collectSeatSpaces = (
    configuration: SeatConfiguration,
  ): {
    space: Space;
    floorNumber: number;
    rowIndex: number;
    colIndex: number;
    rowLength: number;
  }[] => {
    const seats = [];

    // Process each floor
    for (const floor of configuration.floors) {
      const floorNumber = floor.floorNumber;

      // Process each row
      for (let rowIndex = 0; rowIndex < floor.rows.length; rowIndex++) {
        const row = safeGetRow(floor.rows, rowIndex);
        if (!row) continue;

        // Process each space in the row
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
          const space = safeGetSpace(row, colIndex);
          if (!space) continue;

          // Collect only actual seats
          if (space.type === SpaceType.SEAT && space.seatNumber) {
            seats.push({
              space,
              floorNumber,
              rowIndex,
              colIndex,
              rowLength: row.length,
            });
          }
        }
      }
    }

    return seats;
  };

  /**
   * Creates seat payload for storing in the database
   * @param modelId - Bus model ID
   * @param seatNumber - Seat number
   * @param floorNumber - Floor number
   * @param rowIndex - Row index
   * @param colIndex - Column index
   * @param rowNumber - Row number
   * @returns CreateBusSeatPayload object
   */
  const createSeatPayload = (
    modelId: number,
    seatNumber: string,
    floorNumber: number,
    rowIndex: number,
    colIndex: number,
    rowNumber: number,
    rowLength: number,
  ): CreateBusSeatPayload => {
    return {
      modelId,
      seatNumber,
      floorNumber,
      seatFloor: `${DEFAULT_SEAT_FLOOR_PREFIX}${floorNumber}`,
      seatType: SeatType.REGULAR, // Using enum, which is good
      amenities: DEFAULT_AMENITIES, // Use constant for empty array
      position: {
        x: colIndex,
        y: rowNumber,
      },
      meta: {
        rowIndex,
        colIndex,
        isAisle: false, // Hardcoded false is likely specific logic, not a default
        isWindow: colIndex === 0 || colIndex === rowLength - 1, // Specific logic
        isLegroom: rowIndex === 0, // Specific logic
        created: new Date().toISOString(), // Dynamic value, not a default
      },
      active: DEFAULT_IS_ACTIVE, // Use constant for true
      reclinementAngle: DEFAULT_RECLINEMENT_ANGLE, // Use constant
    };
  };

  /**
   * Safely gets a row from an array using Map for protection
   * @param rows - Array of rows
   * @param index - Index to access
   * @returns The row at the index or undefined
   */
  const safeGetRow = (rows: unknown[], index: number): unknown | undefined => {
    const rowsMap = new Map<number, unknown>();
    rows.forEach((row, idx) => rowsMap.set(idx, row));
    return rowsMap.get(index);
  };

  /**
   * Safely gets a space from a row using Map for protection
   * @param row - Array of spaces
   * @param index - Index to access
   * @returns The space at the index or undefined
   */
  const safeGetSpace = (row: unknown[], index: number): unknown | undefined => {
    const spacesMap = new Map<number, unknown>();
    row.forEach((space, idx) => spacesMap.set(idx, space));
    return spacesMap.get(index);
  };

  /**
   * Creates actual bus seats from a theoretical configuration
   * @param modelId - The ID of the bus model
   * @returns {Promise<number>} The number of seats created
   */
  const createSeatsFromTheoreticalConfiguration = async (
    modelId: number,
  ): Promise<number> => {
    // First, check if we already have seats for this model
    const existingSeatsResult = await busSeatRepository.findAllByModel(modelId);
    if (existingSeatsResult.busSeats.length > 0) {
      return existingSeatsResult.busSeats.length; // Seats already exist
    }

    // Generate theoretical configuration
    const model = await busModelRepository.findOne(modelId);
    const configuration = buildTheoreticalConfiguration(model);

    // Collect all seat spaces from the configuration
    const seatSpaces = collectSeatSpaces(configuration);

    // Convert seat spaces to seat payloads
    const seatPayloads: CreateBusSeatPayload[] = seatSpaces.map(
      ({ space, floorNumber, rowIndex, colIndex, rowLength }) => {
        const rowNumber = rowIndex + 1;

        return createSeatPayload(
          modelId,
          space.seatNumber,
          floorNumber,
          rowIndex,
          colIndex,
          rowNumber,
          rowLength,
        );
      },
    );

    // Create all seats in a batch
    if (seatPayloads.length > 0) {
      const result = await busSeatRepository.createBatch(seatPayloads);
      return result.busSeats.length;
    }

    return 0;
  };

  return {
    buildSeatConfiguration,
    createSeatsFromTheoreticalConfiguration,
    buildTheoreticalConfiguration,
  };
};

// Export the bus model use cases instance
export const busModelUseCases = createBusModelUseCases();
