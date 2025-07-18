import { MatchesRegexp, Min, MinLen } from 'encore.dev/validate';
import { PaginatedResult, PaginationParams } from '../../shared/types';

/**
 * Represents a zone in a seat diagram
 */
export interface SeatDiagramZone {
  /** Unique identifier for the zone */
  id: number;

  /** Reference to the seat diagram */
  seatDiagramId: number;

  /** Name of the zone */
  name: string;

  /** Array of row numbers that belong to this zone */
  rowNumbers: number[];

  /** Price multiplier for seats in this zone */
  priceMultiplier: number;

  /** Timestamp when the zone was created */
  createdAt: Date | string | null;

  /** Timestamp when the zone was last updated */
  updatedAt: Date | string | null;
}

/**
 * Input for creating a new seat diagram zone
 */
export interface CreateSeatDiagramZonePayload {
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
 * Input for updating an existing seat diagram zone
 */
export interface UpdateSeatDiagramZonePayload {
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
 * Response containing a list of seat diagram zones
 */
export interface SeatDiagramZones {
  /** List of seat diagram zones */
  seatDiagramZones: SeatDiagramZone[];
}

/**
 * Query options for seat diagram zones
 */
export interface SeatDiagramZoneQueryOptions {
  seatDiagramId?: number;
  orderBy?: { field: keyof SeatDiagramZone; direction: 'asc' | 'desc' }[];
  filters?: Partial<SeatDiagramZone>;
}

/**
 * Paginated response type for the list seat diagram zones endpoint
 */
export type PaginatedSeatDiagramZones = PaginatedResult<SeatDiagramZone>;

/**
 * Pagination parameters for the list seat diagram zones endpoint
 */
export interface PaginationParamsSeatDiagramZones
  extends PaginationParams,
    SeatDiagramZoneQueryOptions {}
