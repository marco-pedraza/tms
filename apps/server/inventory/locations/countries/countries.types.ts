// API types
import { MatchesRegexp, MinLen } from 'encore.dev/validate';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '@/shared/types';

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
  createdAt: Date | string | null;

  /** Timestamp when the country record was last updated */
  updatedAt: Date | string | null;
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

export type ListCountriesQueryParams = ListQueryParams<Country>;
export type ListCountriesResult = ListQueryResult<Country>;

export type PaginatedListCountriesQueryParams =
  PaginatedListQueryParams<Country>;
export type PaginatedListCountriesResult = PaginatedListQueryResult<Country>;
