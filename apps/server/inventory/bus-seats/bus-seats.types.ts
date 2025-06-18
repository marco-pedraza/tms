import { MatchesRegexp, MinLen } from 'encore.dev/validate';
import {
  PaginatedResult,
  SeatPosition,
  SeatType,
  SpaceType,
} from '../../shared/types';

/**
 * Base interface for common properties shared across all space types
 */
interface BaseBusSeat {
  /** Unique identifier for the bus seat */
  id: number;

  /** Seat diagram ID (reference to seat_diagrams) */
  seatDiagramId: number;

  /** Floor number */
  floorNumber: number;

  /** Seat amenities (primarily for SEAT space types) */
  amenities: string[];

  /** Position coordinates in the bus layout */
  position: SeatPosition;

  /** Additional metadata for the space (flexible JSON structure) */
  meta: Record<string, unknown>;

  /** Whether the space is active */
  active: boolean;

  /** Timestamp when the space was created */
  createdAt: Date;

  /** Timestamp when the space was last updated */
  updatedAt: Date;
}

/**
 * Seat space with required seat-specific properties
 */
export interface SeatBusSeat extends BaseBusSeat {
  /** Type of space */
  spaceType: 'seat';

  /** Seat number (required for SEAT space types) */
  seatNumber: string;

  /** Type of seat (required for SEAT space types) */
  seatType: SeatType;

  /** Angle of reclinement in degrees (only for SEAT space types) */
  reclinementAngle?: number;
}

/**
 * Hallway space without seat-specific properties
 */
interface HallwayBusSeat extends BaseBusSeat {
  /** Type of space */
  spaceType: 'hallway';
}

/**
 * Bathroom space without seat-specific properties
 */
interface BathroomBusSeat extends BaseBusSeat {
  /** Type of space */
  spaceType: 'bathroom';
}

/**
 * Empty space without seat-specific properties
 */
interface EmptyBusSeat extends BaseBusSeat {
  /** Type of space */
  spaceType: 'empty';
}

/**
 * Stairs space without seat-specific properties
 */
interface StairsBusSeat extends BaseBusSeat {
  /** Type of space */
  spaceType: 'stairs';
}

/**
 * Bus seat with discriminated union based on space type
 * This ensures that seat-specific properties are only available for SEAT space types
 */
export type BusSeat =
  | SeatBusSeat
  | HallwayBusSeat
  | BathroomBusSeat
  | EmptyBusSeat
  | StairsBusSeat;

/**
 * Input for creating a new bus seat
 */
export interface CreateBusSeatPayload {
  /**
   * ID of the seat diagram this space belongs to
   * Must be a positive number
   */
  seatDiagramId: number;

  /**
   * Type of space (seat, stairs, hallway, etc.)
   * @default SpaceType.SEAT
   */
  spaceType?: SpaceType;

  /**
   * Seat number (e.g., "1A", "2B") - required only for SEAT space types
   */
  seatNumber?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Floor number
   * @default 1
   */
  floorNumber?: number;

  /**
   * Type of seat (only applicable for SEAT space types)
   * @default SeatType.REGULAR
   */
  seatType?: SeatType;

  /**
   * Space amenities
   * @default []
   */
  amenities?: string[];

  /**
   * Angle of reclinement in degrees (only for SEAT space types)
   */
  reclinementAngle?: number;

  /**
   * Position coordinates in the bus layout
   */
  position: SeatPosition;

  /**
   * Additional metadata for the space (flexible JSON structure)
   * @default {}
   */
  meta?: Record<string, unknown>;

  /**
   * Whether the space is active
   * @default true
   */
  active?: boolean;
}

/**
 * Input for creating multiple bus seats in a batch
 */
export interface CreateBusSeatBatchPayload {
  /**
   * Array of bus seats to create
   */
  seats: CreateBusSeatPayload[];
}

/**
 * Input for updating a bus seat
 */
export interface UpdateBusSeatPayload {
  /**
   * ID of the seat diagram this space belongs to
   * Must be a positive number
   */
  seatDiagramId?: number;

  /**
   * Type of space (seat, stairs, hallway, etc.)
   */
  spaceType?: SpaceType;

  /**
   * Seat number (e.g., "1A", "2B") - only applicable for SEAT space types
   */
  seatNumber?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Floor number
   */
  floorNumber?: number;

  /**
   * Type of seat (only applicable for SEAT space types)
   */
  seatType?: SeatType;

  /**
   * Space amenities
   */
  amenities?: string[];

  /**
   * Angle of reclinement in degrees (only for SEAT space types)
   */
  reclinementAngle?: number;

  /**
   * Position coordinates in the bus layout
   */
  position?: SeatPosition;

  /**
   * Additional metadata for the space (flexible JSON structure)
   */
  meta?: Record<string, unknown>;

  /**
   * Whether the space is active
   */
  active?: boolean;
}

/**
 * Response containing a list of bus seats
 */
export interface BusSeats {
  /** List of bus seats */
  busSeats: BusSeat[];
}

/**
 * Paginated result of bus seats
 */
export type PaginatedBusSeats = PaginatedResult<BusSeat>;

/**
 * Input for updating seat configuration
 */
export interface UpdateSeatConfigurationPayload {
  /**
   * Array of space configurations to update/create/deactivate
   */
  seats: SeatConfigurationInput[];
}

/**
 * Input for individual seat configuration
 */
export interface SeatConfigurationInput {
  /**
   * Type of space (seat, stairs, hallway, etc.)
   * @default SpaceType.SEAT
   */
  spaceType?: SpaceType;

  /**
   * Seat number (e.g., "1A", "2B") - required only for SEAT space types
   */
  seatNumber?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Floor number (required for space identification)
   * @default 1
   */
  floorNumber: number;

  /**
   * Type of seat (only applicable for SEAT space types)
   * @default SeatType.REGULAR
   */
  seatType?: SeatType;

  /**
   * Space amenities
   * @default []
   */
  amenities?: string[];

  /**
   * Angle of reclinement in degrees (only for SEAT space types)
   */
  reclinementAngle?: number;

  /**
   * Position coordinates in the bus layout (required for space identification)
   */
  position: SeatPosition;

  /**
   * Whether the space is active
   * @default true
   */
  active?: boolean;
}

/**
 * Result of seat configuration update operation
 */
export interface UpdatedSeatConfiguration {
  /** Number of spaces created */
  seatsCreated: number;

  /** Number of spaces updated */
  seatsUpdated: number;

  /** Number of spaces deactivated */
  seatsDeactivated: number;

  /** Total number of active seats (SEAT space types only) */
  totalActiveSeats: number;
}
