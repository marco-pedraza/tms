import { MatchesRegexp, Min, MinLen } from 'encore.dev/validate';
import { PaginatedResult, PaginationParams } from '../../shared/types';

/**
 * Represents a zone in a bus diagram model
 */
export interface BusDiagramModelZone {
  /** Unique identifier for the zone */
  id: number;

  /** Reference to the bus diagram model */
  busDiagramModelId: number;

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
 * Input for creating a new bus diagram model zone
 */
export interface CreateBusDiagramModelZonePayload {
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
 * Input for updating a bus diagram model zone
 */
export interface UpdateBusDiagramModelZonePayload {
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
 * Response containing a list of bus diagram model zones
 */
export interface BusDiagramModelZones {
  /** List of bus diagram model zones */
  busDiagramModelZones: BusDiagramModelZone[];
}

/**
 * Query options for bus diagram model zones
 */
export interface BusDiagramModelZoneQueryOptions {
  busDiagramModelId?: number;
  orderBy?: { field: keyof BusDiagramModelZone; direction: 'asc' | 'desc' }[];
  filters?: Partial<BusDiagramModelZone>;
}

/**
 * Paginated response type for the list bus diagram model zones endpoint
 */
export type PaginatedBusDiagramModelZones =
  PaginatedResult<BusDiagramModelZone>;

/**
 * Pagination parameters for the list bus diagram model zones endpoint
 */
export interface PaginationParamsBusDiagramModelZones
  extends PaginationParams,
    BusDiagramModelZoneQueryOptions {}
