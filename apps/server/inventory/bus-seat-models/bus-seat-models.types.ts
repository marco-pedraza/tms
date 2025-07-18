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
interface BaseBusSeatModel {
  /** Unique identifier for the bus seat model */
  id: number;

  /** Bus diagram model ID (reference to bus_diagram_models) */
  busDiagramModelId: number;

  /** Floor number */
  floorNumber: number;

  /** Seat amenities (primarily for SEAT space types) */
  amenities: string[];

  /** Position coordinates in the bus layout */
  position: SeatPosition;

  /** Additional metadata for the space (flexible JSON structure) */
  meta: Record<string, unknown>;

  /** Whether the space model is active */
  active: boolean;

  /** Timestamp when the space model was created */
  createdAt: Date | string | null;

  /** Timestamp when the space model was last updated */
  updatedAt: Date | string | null;
}

/**
 * Seat space model with required seat-specific properties
 */
export interface SeatBusSeatModel extends BaseBusSeatModel {
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
 * Hallway space model without seat-specific properties
 */
interface HallwayBusSeatModel extends BaseBusSeatModel {
  /** Type of space */
  spaceType: 'hallway';
}

/**
 * Bathroom space model without seat-specific properties
 */
interface BathroomBusSeatModel extends BaseBusSeatModel {
  /** Type of space */
  spaceType: 'bathroom';
}

/**
 * Empty space model without seat-specific properties
 */
interface EmptyBusSeatModel extends BaseBusSeatModel {
  /** Type of space */
  spaceType: 'empty';
}

/**
 * Stairs space model without seat-specific properties
 */
interface StairsBusSeatModel extends BaseBusSeatModel {
  /** Type of space */
  spaceType: 'stairs';
}

/**
 * Bus seat model with discriminated union based on space type
 * This ensures that seat-specific properties are only available for SEAT space types
 */
export type BusSeatModel =
  | SeatBusSeatModel
  | HallwayBusSeatModel
  | BathroomBusSeatModel
  | EmptyBusSeatModel
  | StairsBusSeatModel;

/**
 * Input for creating a new bus seat model
 */
export interface CreateBusSeatModelPayload {
  /**
   * ID of the bus diagram model this space model belongs to
   * Must be a positive number
   */
  busDiagramModelId: number;

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
   * Whether the space model is active
   * @default true
   */
  active?: boolean;
}

/**
 * Input for creating multiple bus space models in a batch
 */
export interface CreateBusSeatModelBatchPayload {
  /**
   * Array of bus space models to create
   */
  seatModels: CreateBusSeatModelPayload[];
}

/**
 * Input for updating a bus seat model
 */
export interface UpdateBusSeatModelPayload {
  /**
   * ID of the bus diagram model this space model belongs to
   * Must be a positive number
   */
  busDiagramModelId?: number;

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
   * Whether the space model is active
   */
  active?: boolean;
}

/**
 * Response containing a list of bus seat models
 */
export interface BusSeatModels {
  /** List of bus seat models */
  busSeatModels: BusSeatModel[];
}

/**
 * Paginated list of bus seat models
 */
export type PaginatedBusSeatModels = PaginatedResult<BusSeatModel>;

/**
 * Input for updating space configuration of a template layout in batch
 */
export interface UpdateSeatConfigurationPayload {
  /**
   * Array of space configurations to update/create/deactivate
   */
  seats: SeatConfigurationInput[];
}

/**
 * Individual space configuration for batch update
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
 * Response containing the updated seat layout configuration
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
