import { MatchesRegexp, MinLen } from 'encore.dev/validate';
import { PaginatedResult, SeatType } from '../../shared/types';

/**
 * Interface for seat position coordinates in layout
 */
export interface SeatPosition {
  x: number;
  y: number;
}

/**
 * Base interface representing a bus seat model entity
 */
export interface BusSeatModel {
  /** Unique identifier for the bus seat model */
  id: number;

  /** Bus diagram model ID (reference to bus_diagram_models) */
  busDiagramModelId: number;

  /** Seat number */
  seatNumber: string;

  /** Floor number */
  floorNumber: number;

  /** Type of seat */
  seatType: SeatType;

  /** Seat amenities */
  amenities: string[];

  /** Angle of reclinement in degrees (if applicable) */
  reclinementAngle?: number;

  /** Position coordinates in the bus layout */
  position: SeatPosition;

  /** Additional metadata for the seat (flexible JSON structure) */
  meta: Record<string, unknown>;

  /** Whether the seat model is active */
  active: boolean;

  /** Timestamp when the seat model was created */
  createdAt: Date;

  /** Timestamp when the seat model was last updated */
  updatedAt: Date;
}

/**
 * Input for creating a new bus seat model
 */
export interface CreateBusSeatModelPayload {
  /**
   * ID of the bus diagram model this seat model belongs to
   * Must be a positive number
   */
  busDiagramModelId: number;

  /**
   * Seat number (e.g., "1A", "2B")
   * Must have at least 1 character
   */
  seatNumber: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Floor number
   * @default 1
   */
  floorNumber?: number;

  /**
   * Type of seat
   * @default SeatType.REGULAR
   */
  seatType?: SeatType;

  /**
   * Seat amenities
   * @default []
   */
  amenities?: string[];

  /**
   * Angle of reclinement in degrees (if applicable)
   */
  reclinementAngle?: number;

  /**
   * Position coordinates in the bus layout
   */
  position: SeatPosition;

  /**
   * Additional metadata for the seat (flexible JSON structure)
   * @default {}
   */
  meta?: Record<string, unknown>;

  /**
   * Whether the seat model is active
   * @default true
   */
  active?: boolean;
}

/**
 * Input for creating multiple bus seat models in a batch
 */
export interface CreateBusSeatModelBatchPayload {
  /**
   * Array of bus seat models to create
   */
  seatModels: CreateBusSeatModelPayload[];
}

/**
 * Input for updating a bus seat model
 */
export interface UpdateBusSeatModelPayload {
  /**
   * ID of the bus diagram model this seat model belongs to
   * Must be a positive number
   */
  busDiagramModelId?: number;

  /**
   * Seat number (e.g., "1A", "2B")
   * Must have at least 1 character
   */
  seatNumber?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Floor number
   */
  floorNumber?: number;

  /**
   * Type of seat
   */
  seatType?: SeatType;

  /**
   * Seat amenities
   */
  amenities?: string[];

  /**
   * Angle of reclinement in degrees (if applicable)
   */
  reclinementAngle?: number;

  /**
   * Position coordinates in the bus layout
   */
  position?: SeatPosition;

  /**
   * Additional metadata for the seat (flexible JSON structure)
   */
  meta?: Record<string, unknown>;

  /**
   * Whether the seat model is active
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
