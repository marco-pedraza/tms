import { ValidationError } from '../../shared/errors';
import { FloorSeats, SeatType, SpaceType } from '../../shared/types';
import { arraysEqual } from '../../shared/utils';
import type { SeatDiagram } from '../seat-diagrams/seat-diagrams.types';
import type {
  BusSeat,
  CreateBusSeatPayload,
  SeatBusSeat,
  SeatConfigurationInput,
} from './bus-seats.types';

// Constants for default values
export const DEFAULT_SEAT_TYPE = SeatType.REGULAR;
export const DEFAULT_AMENITIES: string[] = [];
export const DEFAULT_RECLINEMENT_ANGLE = 120;
export const DEFAULT_IS_ACTIVE = true;
export const INITIAL_SEAT_NUMBER_COUNTER = 1;

// Domain-specific error messages for validations
const BUS_SEAT_VALIDATION_ERRORS = {
  INVALID_FLOOR_CONFIG: 'Invalid seatsPerFloor configuration',
  DUPLICATE_SEAT_NUMBERS: 'Duplicate seat numbers found in payload',
  DUPLICATE_POSITIONS: 'Duplicate positions found in payload',
  MISSING_REQUIRED_FIELDS:
    'Missing required fields: floorNumber and position are required for seat identification',
  INVALID_FLOOR_NUMBER: (floorNumber: number, maxFloors: number) =>
    `Invalid floor number ${floorNumber}. Must be between 1 and ${maxFloors}`,
  INVALID_ROW_NUMBER: (row: number, maxRows: number, floor: number) =>
    `Invalid row number ${row} for floor ${floor}. Must be between 1 and ${maxRows}`,
  INVALID_COLUMN_NUMBER: (col: number, maxCols: number, floor: number) =>
    `Invalid column number ${col} for floor ${floor}. Must be between 0 and ${maxCols - 1}`,
  SEAT_NUMBER_REQUIRED: 'Seat number is required for SEAT space types',
  FLOOR_CONFIG_NOT_FOUND: (floorNumber: number) =>
    `Floor configuration not found for floor ${floorNumber}`,
} as const;

// Domain-specific error messages for bus seats
export const BUS_SEAT_ERRORS = {
  INVALID_FLOOR_CONFIG: (floorNum: number) =>
    `Floor configuration not found for floor ${floorNum}`,
} as const;

/**
 * Helper function to check if a space type is SEAT
 * @param spaceType - The space type to check
 * @returns True if the space type is SEAT
 */
export function isSpaceTypeSeat(spaceType: SpaceType): boolean {
  return spaceType === SpaceType.SEAT;
}

/**
 * Helper function to safely get seat-specific value
 * @param spaceType - The space type
 * @param seatValue - Value to return if it's a seat
 * @param defaultValue - Default value for non-seat types
 * @returns The appropriate value based on space type
 */
export function getSeatSpecificValue<T>(
  spaceType: SpaceType,
  seatValue: T,
  defaultValue: T,
): T {
  return isSpaceTypeSeat(spaceType) ? seatValue : defaultValue;
}

/**
 * Calculates seat-specific meta properties based on position and floor configuration
 * @param position - The seat position {x, y}
 * @param floorConfig - The floor configuration with seatsLeft and seatsRight
 * @returns Object with isWindow and isLegroom properties
 */
export function calculateSeatMetaProperties(
  position: { x: number; y: number },
  floorConfig: FloorSeats,
): { isWindow: boolean; isLegroom: boolean } {
  // Calculate if seat is at window position
  // Window seats are at the leftmost (x=0) or rightmost positions
  const rightmostPosition = floorConfig.seatsLeft + floorConfig.seatsRight;
  const isWindow = position.x === 0 || position.x === rightmostPosition;

  // Calculate if seat has legroom (typically first row)
  const isLegroom = position.y === 1; // First row (1-based positioning)

  return { isWindow, isLegroom };
}

/**
 * Creates seat payload for storing in the database
 * @param seatDiagramId - Seat diagram ID
 * @param seatNumber - Seat number (only for SEAT space types)
 * @param floorNumber - Floor number
 * @param rowIndex - Row index (0-based)
 * @param colIndex - Column index (0-based)
 * @param floorConfig - Floor configuration for calculating seat properties
 * @param spaceType - Type of space (defaults to SEAT)
 * @returns CreateBusSeatPayload object
 */
export function createSeatPayload(
  seatDiagramId: number,
  seatNumber: string,
  floorNumber: number,
  rowIndex: number,
  colIndex: number,
  floorConfig: FloorSeats,
  spaceType: SpaceType = SpaceType.SEAT,
): CreateBusSeatPayload {
  const rowNumber = rowIndex + 1; // Convert to 1-based row number
  const position = { x: colIndex, y: rowNumber };

  return {
    seatDiagramId,
    spaceType,
    seatNumber: getSeatSpecificValue(spaceType, seatNumber, undefined),
    floorNumber,
    seatType: getSeatSpecificValue(spaceType, DEFAULT_SEAT_TYPE, undefined),
    amenities: getSeatSpecificValue(spaceType, DEFAULT_AMENITIES, []),
    position,
    meta: {
      // Position properties (always present for all space types)
      rowIndex,
      colIndex,
      // Seat-specific properties (only for SEAT space types)
      ...(isSpaceTypeSeat(spaceType) &&
        calculateSeatMetaProperties(position, floorConfig)),
    },
    active: DEFAULT_IS_ACTIVE,
    reclinementAngle: getSeatSpecificValue(
      spaceType,
      DEFAULT_RECLINEMENT_ANGLE,
      undefined,
    ),
  };
}

/**
 * Generates seat payloads for a single floor
 * @param seatDiagramId - Seat diagram ID
 * @param floorConfig - Floor configuration
 * @param seatNumberCounter - Current seat number counter (will be modified)
 * @returns [Array of seat payloads, updated seat counter]
 */
export function generateFloorSeats(
  seatDiagramId: number,
  floorConfig: FloorSeats,
  seatNumberCounter: number,
): [CreateBusSeatPayload[], number] {
  const seats: CreateBusSeatPayload[] = [];
  let currentSeatCounter = seatNumberCounter;

  // Generate seats for each row
  for (let rowIndex = 0; rowIndex < floorConfig.numRows; rowIndex++) {
    // Generate left side seats
    for (let leftSeat = 0; leftSeat < floorConfig.seatsLeft; leftSeat++) {
      const seatNumber = String(currentSeatCounter++);
      const colIndex = leftSeat;

      seats.push(
        createSeatPayload(
          seatDiagramId,
          seatNumber,
          floorConfig.floorNumber,
          rowIndex,
          colIndex,
          floorConfig,
        ),
      );
    }

    // Skip the aisle (middle position)
    // Generate right side seats
    for (let rightSeat = 0; rightSeat < floorConfig.seatsRight; rightSeat++) {
      const seatNumber = String(currentSeatCounter++);
      const colIndex = floorConfig.seatsLeft + 1 + rightSeat; // +1 for aisle

      seats.push(
        createSeatPayload(
          seatDiagramId,
          seatNumber,
          floorConfig.floorNumber,
          rowIndex,
          colIndex,
          floorConfig,
        ),
      );
    }
  }

  return [seats, currentSeatCounter];
}

/**
 * Generates all seat payloads for a seat diagram
 * @param seatDiagram - The seat diagram
 * @param seatDiagramId - The ID of the seat diagram
 * @returns Array of seat payloads ready for database creation
 * @throws {ValidationError} If the floor configuration is invalid
 */
export function generateAllSeats(
  seatDiagram: SeatDiagram,
  seatDiagramId: number,
): CreateBusSeatPayload[] {
  const seatsPerFloor = seatDiagram.seatsPerFloor;
  const allSeats: CreateBusSeatPayload[] = [];
  let seatNumberCounter = INITIAL_SEAT_NUMBER_COUNTER;

  // Generate seats for each floor
  for (let floorNum = 1; floorNum <= seatDiagram.numFloors; floorNum++) {
    const floorConfig = seatsPerFloor.find(
      (config) => config.floorNumber === floorNum,
    );

    if (!floorConfig) {
      throw new ValidationError(BUS_SEAT_ERRORS.INVALID_FLOOR_CONFIG(floorNum));
    }

    const [floorSeats, updatedCounter] = generateFloorSeats(
      seatDiagramId,
      floorConfig,
      seatNumberCounter,
    );

    allSeats.push(...floorSeats);
    seatNumberCounter = updatedCounter;
  }

  return allSeats;
}

/**
 * Type guard to check if a seat is a SEAT space type
 * @param seat - The seat to check
 * @returns True if the seat is a SEAT space type
 */
export function isSeatType(seat: BusSeat): seat is SeatBusSeat {
  return seat.spaceType === SpaceType.SEAT;
}

/**
 * Determines if a seat needs updating based on incoming configuration
 * @param incomingSpaceType - The incoming space type
 * @param incomingSeat - The incoming seat configuration
 * @param existingSeat - The existing seat in database
 * @returns True if the seat needs updating
 */
export function needsSeatUpdate(
  incomingSpaceType: SpaceType,
  incomingSeat: SeatConfigurationInput & { seatKey: string },
  existingSeat: BusSeat,
): boolean {
  // Check space type change
  if (incomingSpaceType !== existingSeat.spaceType) {
    return true;
  }

  // Check seat-specific fields only if both are SEAT types
  if (isSpaceTypeSeat(incomingSpaceType) && isSeatType(existingSeat)) {
    if (incomingSeat.seatNumber !== existingSeat.seatNumber) {
      return true;
    }
    if (
      incomingSeat.seatType !== undefined &&
      incomingSeat.seatType !== existingSeat.seatType
    ) {
      return true;
    }
    if (
      incomingSeat.amenities !== undefined &&
      !arraysEqual(incomingSeat.amenities, existingSeat.amenities)
    ) {
      return true;
    }
    if (
      incomingSeat.reclinementAngle !== undefined &&
      incomingSeat.reclinementAngle !== existingSeat.reclinementAngle
    ) {
      return true;
    }
  }

  // Check active status
  if (
    incomingSeat.active !== undefined &&
    incomingSeat.active !== existingSeat.active
  ) {
    return true;
  }

  return false;
}

/**
 * Creates update data for an existing seat
 * @param incomingSpaceType - The incoming space type
 * @param incomingSeat - The incoming seat configuration
 * @param existingSeat - The existing seat in database
 * @param seatDiagram - The seat diagram for meta calculations
 * @returns Update data object
 */
export function createSeatUpdateData(
  incomingSpaceType: SpaceType,
  incomingSeat: SeatConfigurationInput & { seatKey: string },
  existingSeat: BusSeat,
  seatDiagram: SeatDiagram,
): Record<string, unknown> {
  const updateData: Record<string, unknown> = {};
  updateData.spaceType = incomingSpaceType;

  // Check if meta field needs recalculation (when spaceType changes)
  const spaceTypeChanged = incomingSpaceType !== existingSeat.spaceType;

  if (spaceTypeChanged) {
    // Update meta field based on space type change
    if (isSpaceTypeSeat(incomingSpaceType)) {
      // Add seat-specific properties for SEAT space types
      const floorConfig = seatDiagram.seatsPerFloor.find(
        (config) => config.floorNumber === incomingSeat.floorNumber,
      );

      if (!floorConfig) {
        throw new ValidationError(
          BUS_SEAT_ERRORS.INVALID_FLOOR_CONFIG(incomingSeat.floorNumber),
        );
      }
      const seatMetaProps = calculateSeatMetaProperties(
        incomingSeat.position,
        floorConfig,
      );
      updateData.meta = {
        ...existingSeat.meta,
        ...seatMetaProps,
      };
    } else {
      // Remove seat-specific properties for non-SEAT space types
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { isWindow, isLegroom, ...metaWithoutSeatProps } =
        existingSeat.meta;
      updateData.meta = metaWithoutSeatProps;
    }
  }

  // Only set seat-specific fields for SEAT space types
  if (isSpaceTypeSeat(incomingSpaceType)) {
    updateData.seatNumber = incomingSeat.seatNumber;
    if (incomingSeat.seatType !== undefined)
      updateData.seatType = incomingSeat.seatType;
    if (incomingSeat.reclinementAngle !== undefined)
      updateData.reclinementAngle = incomingSeat.reclinementAngle;
    // Amenities only for SEAT space types
    if (incomingSeat.amenities !== undefined)
      updateData.amenities = incomingSeat.amenities;
  } else {
    // Clear seat-specific fields for non-seat space types
    updateData.seatNumber = null;
    updateData.seatType = null;
    updateData.reclinementAngle = null;
    updateData.amenities = []; // No amenities for non-seat space types
  }

  if (incomingSeat.active !== undefined)
    updateData.active = incomingSeat.active;

  return updateData;
}

/**
 * Creates a position key for identifying seats by floor and position
 * @param floorNumber - Floor number
 * @param position - Position coordinates
 * @returns String key for position
 */
export function createPositionKey(
  floorNumber: number,
  position: { x: number; y: number },
): string {
  return `${floorNumber}:${position.x}:${position.y}`;
}

/**
 * Creates a new seat payload from incoming configuration
 * @param incomingSeat - The incoming seat configuration
 * @param seatDiagramId - Seat diagram ID
 * @param seatDiagram - The seat diagram for meta calculations
 * @returns CreateBusSeatPayload object
 */
export function createNewSeatPayload(
  incomingSeat: SeatConfigurationInput & { seatKey: string },
  seatDiagramId: number,
  seatDiagram: SeatDiagram,
): CreateBusSeatPayload {
  const spaceType = incomingSeat.spaceType ?? SpaceType.SEAT;

  return {
    seatDiagramId,
    spaceType,
    seatNumber: getSeatSpecificValue(
      spaceType,
      incomingSeat.seatNumber,
      undefined,
    ),
    floorNumber: incomingSeat.floorNumber,
    seatType: getSeatSpecificValue(
      spaceType,
      incomingSeat.seatType ?? DEFAULT_SEAT_TYPE,
      undefined,
    ),
    amenities: getSeatSpecificValue(
      spaceType,
      incomingSeat.amenities ?? DEFAULT_AMENITIES,
      [],
    ),
    reclinementAngle: getSeatSpecificValue(
      spaceType,
      incomingSeat.reclinementAngle ?? DEFAULT_RECLINEMENT_ANGLE,
      undefined,
    ),
    position: incomingSeat.position,
    meta: {
      // Position properties (always present for all space types)
      rowIndex: incomingSeat.position.y - 1, // Convert to 0-based
      colIndex: incomingSeat.position.x,
      // Seat-specific properties (only for SEAT space types)
      ...(isSpaceTypeSeat(spaceType) &&
        (() => {
          // Get floor configuration for accurate calculations
          const floorConfig = seatDiagram.seatsPerFloor.find(
            (config) => config.floorNumber === incomingSeat.floorNumber,
          );

          if (!floorConfig) {
            throw new ValidationError(
              BUS_SEAT_ERRORS.INVALID_FLOOR_CONFIG(incomingSeat.floorNumber),
            );
          }

          return calculateSeatMetaProperties(
            incomingSeat.position,
            floorConfig,
          );
        })()),
    },
    active: incomingSeat.active ?? DEFAULT_IS_ACTIVE,
  };
}

/**
 * Validates space positions against seat diagram limits
 * @param seatConfigurations - Array of space configurations to validate
 * @param seatDiagram - The seat diagram with layout constraints
 * @throws {ValidationError} If any space is outside the valid bounds
 */
export function validateSeatPositionLimits(
  seatConfigurations: SeatConfigurationInput[],
  seatDiagram: SeatDiagram,
): void {
  const seatsPerFloor = seatDiagram.seatsPerFloor;

  for (const config of seatConfigurations) {
    const { floorNumber, position } = config;

    // Validate floor number
    if (floorNumber < 1 || floorNumber > seatDiagram.numFloors) {
      throw new ValidationError(
        BUS_SEAT_VALIDATION_ERRORS.INVALID_FLOOR_NUMBER(
          floorNumber,
          seatDiagram.numFloors,
        ),
      );
    }

    // Get floor configuration
    const floorConfig = seatsPerFloor.find(
      (config) => config.floorNumber === floorNumber,
    );

    if (!floorConfig) {
      throw new ValidationError(
        BUS_SEAT_VALIDATION_ERRORS.FLOOR_CONFIG_NOT_FOUND(floorNumber),
      );
    }

    // Validate row number (position.y)
    if (position.y < 1 || position.y > floorConfig.numRows) {
      throw new ValidationError(
        BUS_SEAT_VALIDATION_ERRORS.INVALID_ROW_NUMBER(
          position.y,
          floorConfig.numRows,
          floorNumber,
        ),
      );
    }

    // Validate column number (position.x) for all space types
    // Allow flexible positioning including aisle for seats (last row, foldable seats, vans, etc.)
    const maxValidColumn = floorConfig.seatsLeft + floorConfig.seatsRight;
    const isValidColumn = position.x >= 0 && position.x <= maxValidColumn;

    if (!isValidColumn) {
      throw new ValidationError(
        BUS_SEAT_VALIDATION_ERRORS.INVALID_COLUMN_NUMBER(
          position.x,
          maxValidColumn + 1,
          floorNumber,
        ),
      );
    }
  }
}

/**
 * Validates space configuration payload for business rules
 * @param seatConfigurations - Array of space configurations to validate
 * @param seatDiagram - The seat diagram with layout constraints (optional for position validation)
 * @throws {ValidationError} If validation fails
 */
export function validateSeatConfigurationPayload(
  seatConfigurations: SeatConfigurationInput[],
  seatDiagram?: SeatDiagram,
): void {
  const positionKeys = new Set<string>();
  const seatNumbers = new Set<string>();

  for (const config of seatConfigurations) {
    if (!config.floorNumber || !config.position) {
      throw new ValidationError(
        BUS_SEAT_VALIDATION_ERRORS.MISSING_REQUIRED_FIELDS,
      );
    }

    const spaceType = config.spaceType ?? SpaceType.SEAT;

    // For SEAT space types, seat number is required
    if (spaceType === SpaceType.SEAT && !config.seatNumber) {
      throw new ValidationError(
        BUS_SEAT_VALIDATION_ERRORS.SEAT_NUMBER_REQUIRED,
      );
    }

    // Check for duplicate positions
    const positionKey = `${config.floorNumber}:${config.position.x}:${config.position.y}`;
    if (positionKeys.has(positionKey)) {
      throw new ValidationError(BUS_SEAT_VALIDATION_ERRORS.DUPLICATE_POSITIONS);
    }
    positionKeys.add(positionKey);

    // Check for duplicate seat numbers (only for SEAT space types)
    if (spaceType === SpaceType.SEAT && config.seatNumber) {
      if (seatNumbers.has(config.seatNumber)) {
        throw new ValidationError(
          BUS_SEAT_VALIDATION_ERRORS.DUPLICATE_SEAT_NUMBERS,
        );
      }
      seatNumbers.add(config.seatNumber);
    }
  }

  // Validate position limits if seat diagram is provided
  if (seatDiagram) {
    validateSeatPositionLimits(seatConfigurations, seatDiagram);
  }
}
