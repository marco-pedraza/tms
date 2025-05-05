// API types
import { MinLen, MatchesRegexp } from 'encore.dev/validate';
import { PaginatedResult, PaginationParams } from '../../shared/types';

/**
 * Base interface representing a country entity
 */
export interface Country {
  /** Unique identifier for the country */
  id: number;

  /** Name of the country */
  name: string;

  /** Whether the country is currently active in the system */
  active: boolean;

  /** ISO country code (e.g., "US", "CA", "MX") */
  code: string;

  /** Timestamp when the country record was created */
  createdAt: Date | null;

  /** Timestamp when the country record was last updated */
  updatedAt: Date | null;
}

/**
 * Input for creating a new country
 */
export interface CreateCountryPayload {
  /**
   * Name of the country
   * Must have at least 1 non-whitespace character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * ISO country code (e.g., "US", "CA", "MX")
   * Must have at least 1 non-whitespace character
   */
  code: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Whether the country is active
   * @default true
   */
  active?: boolean;
}

/**
 * Input for updating a country
 */
export interface UpdateCountryPayload {
  /**
   * Name of the country
   * Must have at least 1 non-whitespace character
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * ISO country code (e.g., "US", "CA", "MX")
   * Must have at least 1 non-whitespace character
   */
  code?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Whether the country is active
   */
  active?: boolean;
}

/**
 * Response type for the list countries endpoint
 */
export interface Countries {
  /** List of countries */
  countries: Country[];
}

export interface CountriesQueryOptions {
  orderBy?: { field: keyof Country; direction: 'asc' | 'desc' }[];
  filters?: Partial<Country>;
}

/**
 * Paginated response type for the list countries endpoint
 */
export type PaginatedCountries = PaginatedResult<Country>;

export interface PaginationParamsCountries
  extends PaginationParams,
    CountriesQueryOptions {}
