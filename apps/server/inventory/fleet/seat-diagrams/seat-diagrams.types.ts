import { MatchesRegexp, MinLen } from 'encore.dev/validate';
import { FloorSeats, PaginatedResult } from '@/shared/types';

/**
 * Represents a seat diagram in the database
 */
export interface SeatDiagram {
  /** Unique identifier for the seat diagram */
  id: number;

  /** Bus diagram model ID (reference to bus_diagram_models) */
  busDiagramModelId: number;

  /** Name of the seat diagram */
  name: string;

  /** Description of the seat diagram */
  description: string | null;

  /** Maximum capacity */
  maxCapacity: number;

  /** Number of floors in the seat diagram */
  numFloors: number;

  /** Configuration of seats per floor */
  seatsPerFloor: FloorSeats[];

  /** Total number of seats */
  totalSeats: number;

  /** Indicates if this is a factory default diagram */
  isFactoryDefault: boolean;

  /** Indicates if the diagram has been modified from its template */
  isModified: boolean;

  /** Whether the seat diagram is active */
  active: boolean;

  /** Timestamp when the seat diagram was created */
  createdAt: Date | string | null;

  /** Timestamp when the seat diagram was last updated */
  updatedAt: Date | string | null;
}

/**
 * Input for creating a new seat diagram
 */
export interface CreateSeatDiagramPayload {
  /**
   * Bus diagram model ID (reference to bus_diagram_models)
   * Must be a valid bus diagram model ID
   */
  busDiagramModelId: number;

  /**
   * Name of the seat diagram
   * Must have at least 1 character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Description of the seat diagram
   */
  description?: string;

  /**
   * Maximum capacity
   * Must be a positive number
   */
  maxCapacity: number;

  /**
   * Number of floors in the seat diagram
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
   * Indicates if this is a factory default diagram
   * @default false
   */
  isFactoryDefault?: boolean;

  /**
   * Indicates if the diagram has been modified from its template
   * @default false
   */
  isModified?: boolean;

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
   * Name of the seat diagram
   * Must have at least 1 character
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Description of the seat diagram
   */
  description?: string;

  /**
   * Maximum capacity
   * Must be a positive number
   */
  maxCapacity?: number;

  /**
   * Number of floors in the seat diagram
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
