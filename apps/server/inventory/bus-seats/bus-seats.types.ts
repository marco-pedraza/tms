import { MinLen, MatchesRegexp } from 'encore.dev/validate';
import { PaginatedResult } from '../../shared/types';

/**
 * Enum for seat types
 */
export enum SeatType {
  REGULAR = 'regular',
  PREMIUM = 'premium',
  VIP = 'vip',
  BUSINESS = 'business',
  EXECUTIVE = 'executive',
}

/**
 * Interface for seat position coordinates in layout
 */
export interface SeatPosition {
  x: number;
  y: number;
}

/**
 * Base interface representing a bus seat entity
 */
export interface BusSeat {
  /** Unique identifier for the bus seat */
  id: number;

  /** ID of the seat diagram this seat belongs to */
  seatDiagramId: number;

  /** Seat number (e.g., "1A", "2B") */
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

  /** Whether the seat is active */
  active: boolean;

  /** Timestamp when the seat was created */
  createdAt: Date;

  /** Timestamp when the seat was last updated */
  updatedAt: Date;
}

/**
 * Input for creating a new bus seat
 */
export interface CreateBusSeatPayload {
  /**
   * ID of the seat diagram this seat belongs to
   * Must be a positive number
   */
  seatDiagramId: number;

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
   * Whether the seat is active
   * @default true
   */
  active?: boolean;
}

/**
 * Input for creating multiple bus seats in a batch
 */
export interface CreateBusSeatBatchPayload {
  /**
   * Array of bus seats to create
   */
  seats: CreateBusSeatPayload[];
}

/**
 * Input for updating a bus seat
 */
export interface UpdateBusSeatPayload {
  /**
   * ID of the seat diagram this seat belongs to
   * Must be a positive number
   */
  seatDiagramId?: number;

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
   * Whether the seat is active
   */
  active?: boolean;
}

/**
 * Response containing a list of bus seats
 */
export interface BusSeats {
  /** List of bus seats */
  busSeats: BusSeat[];
}

/**
 * Paginated list of bus seats
 */
export type PaginatedBusSeats = PaginatedResult<BusSeat>;
