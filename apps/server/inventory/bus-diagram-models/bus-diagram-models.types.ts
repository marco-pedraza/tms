import { MatchesRegexp, MinLen } from 'encore.dev/validate';
import { FloorSeats, PaginatedResult } from '../../shared/types';

/**
 * Represents a bus diagram model (template) in the database
 */
export interface BusDiagramModel {
  /** Unique identifier for the bus diagram model */
  id: number;

  /** Name of the bus diagram model */
  name: string;

  /** Description of the bus diagram model */
  description: string | null;

  /** Maximum capacity */
  maxCapacity: number;

  /** Number of floors in the bus diagram model */
  numFloors: number;

  /** Configuration of seats per floor */
  seatsPerFloor: FloorSeats[];

  /** Total number of seats */
  totalSeats: number;

  /** Indicates if this is a factory default model */
  isFactoryDefault: boolean;

  /** Whether the bus diagram model is active */
  active: boolean;

  /** Timestamp when the bus diagram model was created */
  createdAt: Date;

  /** Timestamp when the bus diagram model was last updated */
  updatedAt: Date;
}

/**
 * Input for creating a new bus diagram model
 */
export interface CreateBusDiagramModelPayload {
  /**
   * Name of the bus diagram model
   * Must have at least 1 character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Description of the bus diagram model
   */
  description?: string;

  /**
   * Maximum capacity
   * Must be a positive number
   */
  maxCapacity: number;

  /**
   * Number of floors in the bus diagram model
   * Must be a positive number
   */
  numFloors: number;

  /**
   * Configuration of seats per floor
   */
  seatsPerFloor: FloorSeats[];

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
   * Whether the bus diagram model is active
   * @default true
   */
  active?: boolean;
}

/**
 * Input for updating a bus diagram model
 */
export interface UpdateBusDiagramModelPayload {
  /**
   * Name of the bus diagram model
   * Must have at least 1 character
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Description of the bus diagram model
   */
  description?: string;

  /**
   * Maximum capacity
   * Must be a positive number
   */
  maxCapacity?: number;

  /**
   * Number of floors in the bus diagram model
   * Must be a positive number
   */
  numFloors?: number;

  /**
   * Configuration of seats per floor
   */
  seatsPerFloor?: FloorSeats[];

  /**
   * Total number of seats
   */
  totalSeats?: number;

  /**
   * Indicates if this is a factory default model
   */
  isFactoryDefault?: boolean;

  /**
   * Whether the bus diagram model is active
   */
  active?: boolean;
}

/**
 * Response containing a list of bus diagram models
 */
export interface BusDiagramModels {
  /** List of bus diagram models */
  busDiagramModels: BusDiagramModel[];
}

/**
 * Paginated result of bus diagram models
 */
export type PaginatedBusDiagramModels = PaginatedResult<BusDiagramModel>;
