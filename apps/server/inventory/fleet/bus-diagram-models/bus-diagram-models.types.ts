import { MatchesRegexp, MinLen } from 'encore.dev/validate';
import {
  FloorSeats,
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '@/shared/types';

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
  createdAt: Date | string | null;

  /** Timestamp when the bus diagram model was last updated */
  updatedAt: Date | string | null;
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
  description?: string | null;

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
  description?: string | null;

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
 * Response for seat diagram synchronization summary
 */
export interface SeatDiagramSyncSummary {
  /** ID of the seat diagram that was synced */
  seatDiagramId: number;

  /** Number of seats created during sync */
  created: number;

  /** Number of seats updated during sync */
  updated: number;

  /** Number of seats deleted during sync */
  deleted: number;
}

/**
 * Response for the regenerate seats operation
 */
export interface RegenerateSeatsResponse {
  /** Array of sync summaries, one for each diagram that was synced */
  summaries: SeatDiagramSyncSummary[];
}

/**
 * Query parameters for listing bus diagram models without pagination
 */
export type ListBusDiagramModelsQueryParams = ListQueryParams<BusDiagramModel>;

/**
 * Response for listing bus diagram models without pagination
 */
export type ListBusDiagramModelsResult = ListQueryResult<BusDiagramModel>;

/**
 * Query parameters for listing bus diagram models with pagination
 */
export type PaginatedListBusDiagramModelsQueryParams =
  PaginatedListQueryParams<BusDiagramModel>;

/**
 * Response for listing bus diagram models with pagination
 */
export type PaginatedListBusDiagramModelsResult =
  PaginatedListQueryResult<BusDiagramModel>;
