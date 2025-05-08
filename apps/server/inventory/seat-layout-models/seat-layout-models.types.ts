import { MinLen, MatchesRegexp } from 'encore.dev/validate';
import { PaginatedResult } from '../../shared/types';

/**
 * Seat configuration for a specific floor
 */
export interface FloorSeats {
  /** Floor number */
  floorNumber: number;

  /** Number of rows in this floor */
  numRows: number;

  /** Number of seats on the left side per row for this floor */
  seatsLeft: number;

  /** Number of seats on the right side per row for this floor */
  seatsRight: number;
}

/**
 * Bathroom row configuration
 */
export interface BathroomLocation {
  /** Floor number */
  floorNumber: number;

  /** Row number */
  rowNumber: number;
}

/**
 * Represents a seat layout model (template) in the database
 */
export interface SeatLayoutModel {
  /** Unique identifier for the seat layout model */
  id: number;

  /** Name of the seat layout model */
  name: string;

  /** Description of the seat layout model */
  description: string | null;

  /** Maximum capacity */
  maxCapacity: number;

  /** Number of floors in the seat layout model */
  numFloors: number;

  /** Configuration of seats per floor */
  seatsPerFloor: FloorSeats[];

  /** Rows with bathrooms */
  bathroomRows: BathroomLocation[];

  /** Total number of seats */
  totalSeats: number;

  /** Indicates if this is a factory default model */
  isFactoryDefault: boolean;

  /** Whether the seat layout model is active */
  active: boolean;

  /** Timestamp when the seat layout model was created */
  createdAt: Date;

  /** Timestamp when the seat layout model was last updated */
  updatedAt: Date;
}

/**
 * Input for creating a new seat layout model
 */
export interface CreateSeatLayoutModelPayload {
  /**
   * Name of the seat layout model
   * Must have at least 1 character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Description of the seat layout model
   */
  description?: string;

  /**
   * Maximum capacity
   * Must be a positive number
   */
  maxCapacity: number;

  /**
   * Number of floors in the seat layout model
   * Must be a positive number
   */
  numFloors: number;

  /**
   * Configuration of seats per floor
   */
  seatsPerFloor: FloorSeats[];

  /**
   * Rows with bathrooms
   * @default []
   */
  bathroomRows?: BathroomLocation[];

  /**
   * Total number of seats
   */
  totalSeats: number;

  /**
   * Indicates if this is a factory default model
   * @default true
   */
  isFactoryDefault?: boolean;

  /**
   * Whether the seat layout model is active
   * @default true
   */
  active?: boolean;
}

/**
 * Input for updating a seat layout model
 */
export interface UpdateSeatLayoutModelPayload {
  /**
   * Name of the seat layout model
   * Must have at least 1 character
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Description of the seat layout model
   */
  description?: string;

  /**
   * Maximum capacity
   * Must be a positive number
   */
  maxCapacity?: number;

  /**
   * Number of floors in the seat layout model
   * Must be a positive number
   */
  numFloors?: number;

  /**
   * Configuration of seats per floor
   */
  seatsPerFloor?: FloorSeats[];

  /**
   * Rows with bathrooms
   */
  bathroomRows?: BathroomLocation[];

  /**
   * Total number of seats
   */
  totalSeats?: number;

  /**
   * Indicates if this is a factory default model
   */
  isFactoryDefault?: boolean;

  /**
   * Whether the seat layout model is active
   */
  active?: boolean;
}

/**
 * Response containing a list of seat layout models
 */
export interface SeatLayoutModels {
  /** List of seat layout models */
  seatLayoutModels: SeatLayoutModel[];
}

/**
 * Paginated result of seat layout models
 */
export type PaginatedSeatLayoutModels = PaginatedResult<SeatLayoutModel>;
