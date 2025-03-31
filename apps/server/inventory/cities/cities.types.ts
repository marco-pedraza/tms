import { MinLen, MatchesRegexp, Min } from 'encore.dev/validate';
import { PaginatedResult } from '../../shared/types';

/**
 * Base interface representing a city entity
 */
export interface City {
  /** Unique identifier for the city */
  id: number;

  /** Name of the city */
  name: string;

  /** ID of the state this city belongs to */
  stateId: number;

  /** Latitude of the city */
  latitude: number;

  /** Longitude of the city */
  longitude: number;

  /** Timezone of the city (e.g., "America/Mexico_City") */
  timezone: string;

  /** Whether the city is currently active in the system */
  active: boolean;

  /** Timestamp when the city record was created */
  createdAt: Date | null;

  /** Timestamp when the city record was last updated */
  updatedAt: Date | null;

  /** URL-friendly identifier for the city */
  slug: string;
}

/**
 * Input for creating a new city
 */
export interface CreateCityPayload {
  /**
   * The name of the city
   * Must have at least 1 non-whitespace character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * The ID of the state this city belongs to
   * Must be a positive number
   */
  stateId: number & Min<1>;

  /**
   * Latitude of the city
   * Must be a number
   */
  latitude: number & Min<1>;

  /**
   * Longitude of the city
   * Must be a number
   */
  longitude: number & Min<1>;

  /**
   * Timezone of the city (e.g., "America/Mexico_City")
   * Must have at least 1 non-whitespace character
   */
  timezone: string &
    MinLen<1> &
    MatchesRegexp<'^America/([A-Za-z_]+)(/[A-Za-z_]+)?$'>;

  /**
   * URL-friendly identifier for the city
   * Must be lowercase, can contain only letters, numbers and hyphens
   * No consecutive hyphens, special characters or spaces allowed
   * Format examples: 'ciudad-de-mexico', 'monterrey', 'san-luis-potosi'
   */
  slug: string & MinLen<1> & MatchesRegexp<'^[a-z0-9]+(?:-[a-z0-9]+)*$'>;

  /**
   * Whether the city is active
   * @default true
   */
  active?: boolean;
}

/**
 * Input for updating a city
 */
export interface UpdateCityPayload {
  /**
   * The name of the city
   * Must have at least 1 non-whitespace character
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * The ID of the state this city belongs to
   * Must be a positive number
   */
  stateId?: number & Min<1>;

  /**
   * Latitude of the city
   * Must be a number
   */
  latitude?: number & Min<1>;

  /**
   * Longitude of the city
   * Must be a number
   */
  longitude?: number & Min<1>;

  /**
   * Timezone of the city (e.g., "America/Mexico_City")
   * Must have at least 1 non-whitespace character
   */
  timezone?: string &
    MinLen<1> &
    MatchesRegexp<'^America/([A-Za-z_]+)(/[A-Za-z_]+)?$'>;

  /**
   * URL-friendly identifier for the city
   * Must be lowercase, can contain only letters, numbers and hyphens
   * No consecutive hyphens, special characters or spaces allowed
   * Format examples: 'ciudad-de-mexico', 'monterrey', 'san-luis-potosi'
   */
  slug?: string & MinLen<1> & MatchesRegexp<'^[a-z0-9]+(?:-[a-z0-9]+)*$'>;

  /**
   * Whether the city is active
   */
  active?: boolean;
}

/**
 * Response type for the list cities endpoint
 */
export interface Cities {
  /** List of cities */
  cities: City[];
}

/**
 * Paginated response type for the list cities endpoint
 */
export type PaginatedCities = PaginatedResult<City>;
