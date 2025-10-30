import { MatchesRegexp, Min, MinLen } from 'encore.dev/validate';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '@/shared/types';
import type { PathwayOptionToll } from '../pathway-options-tolls/pathway-options-tolls.types';

/**
 * Base interface representing a pathway option entity
 */
export interface PathwayOption {
  /** Unique identifier for the pathway option */
  id: number;

  /** ID of the pathway this option belongs to */
  pathwayId: number;

  /** Name of the pathway option */
  name: string | null;

  /** Description of the pathway option */
  description: string | null;

  /** Distance in kilometers */
  distanceKm: number | null;

  /** Typical time in minutes */
  typicalTimeMin: number | null;

  /** Average speed in kilometers per hour */
  avgSpeedKmh: number | null;

  /** Whether this is the default option for the pathway */
  isDefault: boolean | null;

  /** Whether this option allows pass-through */
  isPassThrough: boolean | null;

  /** Pass-through time in minutes */
  passThroughTimeMin: number | null;

  /** Sequence order for this option */
  sequence: number | null;

  /** Whether the pathway option is active */
  active: boolean | null;

  /** Timestamp when the pathway option was created */
  createdAt: Date | string | null;

  /** Timestamp when the pathway option was last updated */
  updatedAt: Date | string | null;

  /** Timestamp when the pathway option was deleted */
  deletedAt: Date | string | null;

  /** Array of tolls associated with this pathway option (optional, populated when needed) */
  tolls?: PathwayOptionToll[];
}

/**
 * Interface for creating a new pathway option
 */
export interface CreatePathwayOptionPayload {
  /**
   * ID of the pathway this option belongs to
   * Must be a positive number
   */
  pathwayId: number & Min<1>;

  /**
   * Name of the pathway option
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Description of the pathway option
   */
  description?: string;

  /**
   * Distance in kilometers
   * Must be a positive number
   */
  distanceKm?: number & Min<0>;

  /**
   * Typical time in minutes
   * Must be a positive number
   */
  typicalTimeMin?: number & Min<0>;

  /**
   * Average speed in kilometers per hour
   * Must be a positive number
   */
  avgSpeedKmh?: number & Min<0>;

  /**
   * Whether this is the default option for the pathway
   */
  isDefault?: boolean;

  /**
   * Whether this option allows pass-through
   */
  isPassThrough?: boolean;

  /**
   * Pass-through time in minutes
   * Must be a positive number
   * Can be set to null to explicitly clear the value
   */
  passThroughTimeMin?: (number & Min<0>) | null;

  /**
   * Sequence order for this option
   * Must be a positive number
   */
  sequence?: number & Min<0>;

  /**
   * Whether the pathway option is active
   */
  active?: boolean;
}

/**
 * Interface for updating a pathway option
 */
export interface UpdatePathwayOptionPayload {
  /**
   * ID of the pathway this option belongs to
   */
  pathwayId?: number & Min<1>;

  /**
   * Name of the pathway option
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Description of the pathway option
   */
  description?: string;

  /**
   * Distance in kilometers
   */
  distanceKm?: number & Min<0>;

  /**
   * Typical time in minutes
   */
  typicalTimeMin?: number & Min<0>;

  /**
   * Average speed in kilometers per hour
   */
  avgSpeedKmh?: number & Min<0>;

  /**
   * Whether this is the default option for the pathway
   */
  isDefault?: boolean;

  /**
   * Whether this option allows pass-through
   */
  isPassThrough?: boolean;

  /**
   * Pass-through time in minutes
   * Can be set to null to explicitly clear the value
   */
  passThroughTimeMin?: (number & Min<0>) | null;

  /**
   * Sequence order for this option
   */
  sequence?: number & Min<0>;

  /**
   * Whether the pathway option is active
   */
  active?: boolean;
}

export type ListPathwayOptionsQueryParams = ListQueryParams<PathwayOption>;
export type ListPathwayOptionsResult = ListQueryResult<PathwayOption>;

export type PaginatedListPathwayOptionsQueryParams =
  PaginatedListQueryParams<PathwayOption>;
export type PaginatedListPathwayOptionsResult =
  PaginatedListQueryResult<PathwayOption>;
