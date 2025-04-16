import { MinLen, MatchesRegexp } from 'encore.dev/validate';
import { PaginatedResult } from '../../shared/types';

/**
 * Space type in bus layout
 */
export enum SpaceType {
  SEAT = 'seat',
  HALLWAY = 'hallway',
  BATHROOM = 'bathroom',
  EMPTY = 'empty',
}

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
 * Base interface representing a bus model entity
 */
export interface BusModel {
  /** Unique identifier for the bus model */
  id: number;

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

  /** Seat configuration for each floor */
  seatsPerFloor: FloorSeats[];

  /** Rows that contain bathrooms */
  bathroomRows: BathroomLocation[];

  /** Available amenities */
  amenities: string[];

  /** Type of engine (e.g., diesel, electric) */
  engineType?: string;

  /** Distribution type of the bus model */
  distributionType?: string;

  /** Whether the bus model is active */
  active: boolean;

  /** Timestamp when the bus model was created */
  createdAt: Date;

  /** Timestamp when the bus model was last updated */
  updatedAt: Date;
}

/**
 * Input for creating a new bus model
 */
export interface CreateBusModelPayload {
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
   * Seat configuration for each floor
   * If not provided, defaults to single floor with 2 seats on each side
   */
  seatsPerFloor?: FloorSeats[];

  /**
   * Rows that contain bathrooms
   * @default []
   */
  bathroomRows?: BathroomLocation[];

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
   * Seat configuration for each floor
   */
  seatsPerFloor?: FloorSeats[];

  /**
   * Rows that contain bathrooms
   */
  bathroomRows?: BathroomLocation[];

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
 * Seat configuration type for bus layout
 */
export interface SeatConfiguration {
  floors: Floor[];
  amenities: string[];
  totalSeats: number;
}

/**
 * Floor in a bus seat configuration
 */
export interface Floor {
  floorNumber: number;
  rows: Space[][];
}

/**
 * Space in a bus seat configuration
 */
export interface Space {
  type: SpaceType;
  seatNumber?: string;
  seatType?: string;
  amenities?: string[];
  meta?: Record<string, unknown>;
  reclinementAngle?: number;
}

/**
 * Paginated list of bus models
 */
export type PaginatedBusModels = PaginatedResult<BusModel>;
