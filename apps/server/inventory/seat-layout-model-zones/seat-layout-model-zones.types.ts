import { MatchesRegexp, Min, MinLen } from 'encore.dev/validate';
import { PaginatedResult, PaginationParams } from '../../shared/types';

/**
 * Represents a zone in a seat layout model
 */
export interface SeatLayoutModelZone {
  /** Unique identifier for the zone */
  id: number;

  /** Reference to the seat layout model */
  seatLayoutModelId: number;

  /** Name of the zone */
  name: string;

  /** Array of row numbers that belong to this zone */
  rowNumbers: number[];

  /** Price multiplier for seats in this zone */
  priceMultiplier: number;

  /** Timestamp when the zone was created */
  createdAt: Date;

  /** Timestamp when the zone was last updated */
  updatedAt: Date;
}

/**
 * Input for creating a new seat layout model zone
 */
export interface CreateSeatLayoutModelZonePayload {
  /**
   * Name of the zone
   * Must have at least 1 character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Array of row numbers that belong to this zone
   */
  rowNumbers: number[];

  /**
   * Price multiplier for seats in this zone
   * @default 1.0
   */
  priceMultiplier?: number & Min<1>;
}

/**
 * Input for updating a seat layout model zone
 */
export interface UpdateSeatLayoutModelZonePayload {
  /**
   * Name of the zone
   * Must have at least 1 character
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Array of row numbers that belong to this zone
   */
  rowNumbers?: number[];

  /**
   * Price multiplier for seats in this zone
   */
  priceMultiplier?: number & Min<1>;
}

/**
 * Response containing a list of seat layout model zones
 */
export interface SeatLayoutModelZones {
  /** List of seat layout model zones */
  seatLayoutModelZones: SeatLayoutModelZone[];
}

/**
 * Query options for seat layout model zones
 */
export interface SeatLayoutModelZoneQueryOptions {
  seatLayoutModelId?: number;
  orderBy?: { field: keyof SeatLayoutModelZone; direction: 'asc' | 'desc' }[];
  filters?: Partial<SeatLayoutModelZone>;
}

/**
 * Paginated response type for the list seat layout model zones endpoint
 */
export type PaginatedSeatLayoutModelZones =
  PaginatedResult<SeatLayoutModelZone>;

/**
 * Pagination parameters for the list seat layout model zones endpoint
 */
export interface PaginationParamsSeatLayoutModelZones
  extends PaginationParams,
    SeatLayoutModelZoneQueryOptions {}
