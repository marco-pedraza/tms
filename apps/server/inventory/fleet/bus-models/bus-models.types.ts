import { MatchesRegexp, MinLen } from 'encore.dev/validate';
import { PaginatedResult } from '@/shared/types';

/**
 * Base interface representing a bus model entity
 */
export interface BusModel {
  /** Unique identifier for the bus model */
  id: number;

  /** Default bus diagram model ID */
  defaultBusDiagramModelId: number;

  /** Manufacturer of the bus */
  manufacturer: string;

  /** Model name/number */
  model: string;

  /** Year the bus model was released */
  year: number;

  /** Total seating capacity */
  seatingCapacity: number;

  /** Number of floors/decks in the bus */
  numFloors: number;

  /** Available amenities */
  amenities: string[];

  /** Type of engine (e.g., diesel, electric) */
  engineType?: string;

  /** Distribution type of the bus model */
  distributionType?: string;

  /** Whether the bus model is active */
  active: boolean;

  /** Timestamp when the bus model was created */
  createdAt: Date | string | null;

  /** Timestamp when the bus model was last updated */
  updatedAt: Date | string | null;
}

/**
 * Input for creating a new bus model
 */
export interface CreateBusModelPayload {
  /**
   * Default bus diagram model ID
   * Must be a positive number
   */
  defaultBusDiagramModelId: number;

  /**
   * Manufacturer of the bus
   * Must have at least 1 character
   */
  manufacturer: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Model name/number
   * Must have at least 1 character
   */
  model: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Year the bus model was released
   * Must be a positive number
   */
  year: number;

  /**
   * Total seating capacity
   * Must be a positive number
   */
  seatingCapacity: number;

  /**
   * Number of floors/decks in the bus
   * @default 1
   */
  numFloors?: number;

  /**
   * Available amenities
   * @default []
   */
  amenities?: string[];

  /**
   * Type of engine (e.g., diesel, electric)
   */
  engineType?: string;

  /**
   * Distribution type of the bus model
   */
  distributionType?: string;

  /**
   * Whether the bus model is active
   * @default true
   */
  active?: boolean;
}

/**
 * Input for updating a bus model
 */
export interface UpdateBusModelPayload {
  /**
   * Default bus diagram model ID
   */
  defaultBusDiagramModelId?: number;

  /**
   * Manufacturer of the bus
   * Must have at least 1 character
   */
  manufacturer?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Model name/number
   * Must have at least 1 character
   */
  model?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Year the bus model was released
   * Must be a positive number
   */
  year?: number;

  /**
   * Total seating capacity
   * Must be a positive number
   */
  seatingCapacity?: number;

  /**
   * Number of floors/decks in the bus
   */
  numFloors?: number;

  /**
   * Available amenities
   */
  amenities?: string[];

  /**
   * Type of engine (e.g., diesel, electric)
   */
  engineType?: string;

  /**
   * Distribution type of the bus model
   */
  distributionType?: string;

  /**
   * Whether the bus model is active
   */
  active?: boolean;
}

/**
 * Response containing a list of bus models
 */
export interface BusModels {
  /** List of bus models */
  busModels: BusModel[];
}

/**
 * Paginated bus models result
 */
export type PaginatedBusModels = PaginatedResult<BusModel>;
