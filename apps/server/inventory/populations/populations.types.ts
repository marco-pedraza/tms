import { MatchesRegexp, MinLen } from 'encore.dev/validate';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '../../shared/types';
import type { City, CityWithStateAndCountry } from '../cities/cities.types';

/**
 * Base interface representing a population entity
 */
export interface Population {
  /** Unique identifier for the population */
  id: number;

  /** Unique code for the population */
  code: string;

  /** Name of the population */
  name: string;

  /** Description of the population */
  description: string | null;

  /** Whether the population is currently active in the system */
  active: boolean;

  /** Timestamp when the population record was created */
  createdAt: Date | null;

  /** Timestamp when the population record was last updated */
  updatedAt: Date | null;
}

/**
 * Population entity with its related cities
 */
export interface PopulationWithRelations extends Population {
  /** Array of cities assigned to this population */
  cities: City[];
}

/**
 * Input for creating a new population
 */
export interface CreatePopulationPayload {
  /**
   * Unique code for the population
   * Must have at least 1 non-whitespace character
   */
  code: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Name of the population
   * Must have at least 1 non-whitespace character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Description of the population
   */
  description?: string;

  /**
   * Whether the population is active
   * @default true
   */
  active?: boolean;
}

/**
 * Input for updating a population
 */
export interface UpdatePopulationPayload {
  /**
   * Unique code for the population
   * Must have at least 1 non-whitespace character
   */
  code?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Name of the population
   * Must have at least 1 non-whitespace character
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Description of the population
   */
  description?: string;

  /**
   * Whether the population is active
   */
  active?: boolean;
}

/**
 * Input for assigning cities to a population
 */
export interface AssignCitiesPayload {
  /**
   * Array of city IDs to assign to the population
   * Must not contain duplicates
   */
  cityIds: number[];
}

export type ListPopulationsQueryParams = ListQueryParams<Population>;
export type ListPopulationsResult = ListQueryResult<Population>;

export type PaginatedListPopulationsQueryParams =
  PaginatedListQueryParams<Population>;
export type PaginatedListPopulationsResult =
  PaginatedListQueryResult<PopulationWithRelations>;

/**
 * Response for listing available cities for a population
 */
export type ListAvailableCitiesResult =
  ListQueryResult<CityWithStateAndCountry>;

/**
 * Response for finding a population by its assigned city
 */
export interface FindPopulationByAssignedCityResult {
  data?: PopulationWithRelations;
}
