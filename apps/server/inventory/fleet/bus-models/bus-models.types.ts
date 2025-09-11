import { MatchesRegexp, MinLen } from 'encore.dev/validate';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '@/shared/types';
import type { Amenity } from '@/inventory/shared-entities/amenities/amenities.types';

/**
 * Enum for bus engine type
 */
export enum EngineType {
  DIESEL = 'DIESEL',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID',
  GASOLINE = 'GASOLINE',
  NATURAL_GAS = 'NATURAL_GAS',
  LPG = 'LPG',
  OTHER = 'OTHER',
}

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

  /** Trunk capacity */
  trunkCapacity: number | null;

  /** Fuel efficiency */
  fuelEfficiency: number | null;

  /** Max capacity */
  maxCapacity: number | null;

  /** Number of floors/decks in the bus */
  numFloors: number;

  /** Type of engine (e.g., diesel, electric) */
  engineType: EngineType;

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
  defaultBusDiagramModelId: number | null;

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
   * Trunk capacity
   * Must be a positive number
   * Optional trunk capacity in kilograms (null if not specified)
   */
  trunkCapacity?: number | null;

  /**
   * Fuel efficiency
   * Must be a positive number
   * Optional fuel efficiency in km/L (null if not specified)
   */
  fuelEfficiency?: number | null;

  /**
   * Max capacity
   * Must be a positive number
   * Optional max capacity in passengers (null if not specified)
   */
  maxCapacity?: number | null;

  /**
   * Number of floors/decks in the bus
   * @default 1
   */
  numFloors: number;

  /**
   * Type of engine (e.g., diesel, electric)
   */
  engineType: EngineType;

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
  defaultBusDiagramModelId?: number | null;

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
   * Trunk capacity
   * Must be a positive number
   * Optional trunk capacity in liters (null if not specified)
   */
  trunkCapacity?: number | null;

  /**
   * Fuel efficiency
   * Must be a positive number
   * Optional fuel efficiency in liters per kilometers (null if not specified)
   */
  fuelEfficiency?: number | null;

  /**
   * Max capacity
   * Must be a positive number
   * Optional max capacity in liters (null if not specified)
   */
  maxCapacity?: number | null;

  /**
   * Number of floors/decks in the bus
   */
  numFloors?: number;

  /**
   * Type of engine (e.g., diesel, electric)
   */
  engineType?: EngineType;

  /**
   * Whether the bus model is active
   */
  active?: boolean;
}

/**
 * Response containing a list of bus models
 */
export interface BusModels {
  busModels: BusModel[];
}

/**
 * Response containing a list of bus models query params
 */
export type ListBusModelsQueryParams = ListQueryParams<BusModel>;

/**
 * Response containing a list of bus models
 */
export type ListBusModelsResult = ListQueryResult<BusModel>;

/**
 * Paginated list of bus models query params
 */
export type PaginatedListBusModelsQueryParams =
  PaginatedListQueryParams<BusModel>;

/**
 * Paginated list of bus models
 */
export type PaginatedListBusModelsResult = PaginatedListQueryResult<BusModel>;

/**
 * Bus model entity with related details (amenities)
 */
export interface BusModelWithDetails extends BusModel {
  amenities: Amenity[];
}
