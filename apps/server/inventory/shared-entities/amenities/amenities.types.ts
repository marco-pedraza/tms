import { MatchesRegexp, MinLen } from 'encore.dev/validate';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '@/shared/types';

/**
 * Enum for amenity types
 * Defines the two supported amenity types in the system
 */
export enum AmenityType {
  BUS = 'bus',
  INSTALLATION = 'installation',
}

/**
 * Enum for amenity categories
 * Defines the allowed categories for amenities
 */
export enum AmenityCategory {
  BASIC = 'basic',
  COMFORT = 'comfort',
  TECHNOLOGY = 'technology',
  SECURITY = 'security',
  ACCESSIBILITY = 'accessibility',
  SERVICES = 'services',
}

/**
 * Base interface representing an amenity entity
 */
export interface Amenity {
  /** Unique identifier for the amenity */
  id: number;

  /** Name of the amenity */
  name: string;

  /** Category of the amenity */
  category: AmenityCategory;

  /** Type of amenity within the category */
  amenityType: AmenityType;

  /** Optional description of the amenity */
  description: string | null;

  /** Optional icon name for UI display */
  iconName: string | null;

  /** Whether the amenity is active/available */
  active: boolean;

  /** Timestamp when the amenity record was created */
  createdAt: Date | string | null;

  /** Timestamp when the amenity record was last updated */
  updatedAt: Date | string | null;

  /** Timestamp when the amenity was soft deleted */
  deletedAt: Date | string | null;
}

/**
 * Input for creating a new amenity
 */
export interface CreateAmenityPayload {
  /**
   * Name of the amenity
   * Must have at least 1 non-whitespace character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Category of the amenity
   * Must be one of the allowed categories
   */
  category: AmenityCategory;

  /**
   * Type of amenity within the category
   * Must be either 'bus' or 'installation'
   */
  amenityType: AmenityType;

  /**
   * Optional description of the amenity
   */
  description?: string | null;

  /**
   * Optional icon name for UI display
   */
  iconName?: string | null;

  /**
   * Whether the amenity is active/available
   * @default true
   */
  active?: boolean;
}

/**
 * Input for updating an existing amenity
 */
export interface UpdateAmenityPayload {
  /**
   * Name of the amenity
   * Must have at least 1 non-whitespace character
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Category of the amenity
   * Must be one of the allowed categories
   */
  category?: AmenityCategory;

  /**
   * Type of amenity within the category
   * Must be either 'bus' or 'installation'
   */
  amenityType?: AmenityType;

  /**
   * Optional description of the amenity
   */
  description?: string | null;

  /**
   * Optional icon name for UI display
   */
  iconName?: string | null;

  /**
   * Whether the amenity is active/available
   */
  active?: boolean;
}

export type ListAmenitiesQueryParams = ListQueryParams<Amenity>;
export type ListAmenitiesResult = ListQueryResult<Amenity>;

export type PaginatedListAmenitiesQueryParams =
  PaginatedListQueryParams<Amenity>;
export type PaginatedListAmenitiesResult = PaginatedListQueryResult<Amenity>;
