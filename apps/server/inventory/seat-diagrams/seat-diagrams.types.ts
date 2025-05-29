import { MatchesRegexp, MinLen } from 'encore.dev/validate';
import { PaginatedResult } from '../../shared/types';

/**
 * Space type in seat diagram layout
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
 * Seat configuration type for seat layout
 */
export interface SeatConfiguration {
  /** Floors in the configuration */
  floors: Floor[];

  /** Total number of seats */
  totalSeats: number;
}

/**
 * Floor in a seat configuration
 */
export interface Floor {
  /** Floor number */
  floorNumber: number;

  /** Rows of spaces */
  rows: Space[][];
}

/**
 * Space in a seat configuration
 */
export interface Space {
  /** Type of space */
  type: SpaceType;

  /** Seat number if this is a seat */
  seatNumber?: string;

  /** Type of seat if this is a seat */
  seatType?: string;

  /** Amenities for this space */
  amenities?: string[];

  /** Additional metadata */
  meta?: Record<string, unknown>;

  /** Reclinement angle for seats */
  reclinementAngle?: number;
}

/**
 * Base interface representing a seat diagram entity
 */
export interface SeatDiagram {
  /** Unique identifier for the seat diagram */
  id: number;

  /** Bus Diagram Model ID (reference to bus_diagram_models) */
  busDiagramModelId: number;

  /** Name of the diagram */
  name: string;

  /** Maximum capacity */
  maxCapacity: number;

  /** Number of floors in the bus */
  numFloors: number;

  /** Indicates if the diagram allows purchasing adjacent seats */
  allowsAdjacentSeat: boolean;

  /** Observations about the diagram */
  observations?: string;

  /** Configuration of seats per floor */
  seatsPerFloor: FloorSeats[];

  /** Rows with bathrooms */
  bathroomRows: BathroomLocation[];

  /** Total number of seats */
  totalSeats: number;

  /** Indicates if this is a factory default diagram */
  isFactoryDefault: boolean;

  /** Whether the seat diagram is active */
  active: boolean;

  /** Timestamp when the seat diagram was created */
  createdAt: Date;

  /** Timestamp when the seat diagram was last updated */
  updatedAt: Date;
}

/**
 * Input for creating a new seat diagram
 */
export interface CreateSeatDiagramPayload {
  /**
   * Bus Diagram Model ID (reference to bus_diagram_models)
   * Required reference to a bus diagram model template
   */
  busDiagramModelId: number;

  /**
   * Name of the diagram
   * Must have at least 1 character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Maximum capacity
   * Must be a positive number
   */
  maxCapacity: number;

  /**
   * Indicates if the diagram allows purchasing adjacent seats
   * @default false
   */
  allowsAdjacentSeat?: boolean;

  /**
   * Observations about the diagram
   */
  observations?: string;

  /**
   * Number of floors in the bus
   * @default 1
   */
  numFloors?: number;

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
   * Indicates if this is a factory default diagram
   * @default true
   */
  isFactoryDefault?: boolean;

  /**
   * Whether the seat diagram is active
   * @default true
   */
  active?: boolean;
}

/**
 * Input for updating a seat diagram
 */
export interface UpdateSeatDiagramPayload {
  /**
   * Name of the diagram
   * Must have at least 1 character
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Maximum capacity
   * Must be a positive number
   */
  maxCapacity?: number;

  /**
   * Indicates if the diagram allows purchasing adjacent seats
   */
  allowsAdjacentSeat?: boolean;

  /**
   * Observations about the diagram
   */
  observations?: string;

  /**
   * Number of floors in the bus
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
   * Indicates if this is a factory default diagram
   */
  isFactoryDefault?: boolean;

  /**
   * Whether the seat diagram is active
   */
  active?: boolean;
}

/**
 * Response containing a list of seat diagrams
 */
export interface SeatDiagrams {
  /** List of seat diagrams */
  seatDiagrams: SeatDiagram[];
}

/**
 * Paginated result of seat diagrams
 */
export type PaginatedSeatDiagrams = PaginatedResult<SeatDiagram>;
