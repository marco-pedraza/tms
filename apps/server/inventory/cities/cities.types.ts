import { MatchesRegexp, Max, Min, MinLen } from 'encore.dev/validate';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '../../shared/types';
import type { Country } from '../countries/countries.types';
import type { Population } from '../populations/populations.types';
import type { State } from '../states/states.types';

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
   * Name of the city
   * Must contain only letters (with or without accents) and spaces
   */
  name: string & MinLen<1> & MatchesRegexp<'^[A-Za-zÀ-ÖØ-öø-ÿ\\s]+$'>;

  /**
   * ID of the state this city belongs to
   * Must be a positive number
   */
  stateId: number & Min<1>;

  /**
   * Latitude of the city
   * Must be a number between -90 and 90
   */
  latitude: number & Min<-90> & Max<90>;

  /**
   * Longitude of the city
   * Must be a number between -180 and 180
   */
  longitude: number & Min<-180> & Max<180>;

  /**
   * Timezone of the city (e.g., "America/Mexico_City")
   * Must have at least 1 non-whitespace character
   */
  timezone: string &
    MinLen<1> &
    MatchesRegexp<'^America/([A-Za-z_]+)(/[A-Za-z_]+)?$'>;

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
   * Name of the city
   * Must contain only letters (with or without accents) and spaces
   */
  name?: string & MinLen<1> & MatchesRegexp<'^[A-Za-zÀ-ÖØ-öø-ÿ\\s]+$'>;

  /**
   * ID of the state this city belongs to
   * Must be a positive number
   */
  stateId?: number & Min<1>;

  /**
   * Latitude of the city
   * Must be a number between -90 and 90
   */
  latitude?: number & Min<-90> & Max<90>;

  /**
   * Longitude of the city
   * Must be a number between -180 and 180
   */
  longitude?: number & Min<-180> & Max<180>;

  /**
   * Timezone of the city (e.g., "America/Mexico_City")
   * Must have at least 1 non-whitespace character
   */
  timezone?: string &
    MinLen<1> &
    MatchesRegexp<'^America/([A-Za-z_]+)(/[A-Za-z_]+)?$'>;

  /**
   * Whether the city is active
   */
  active?: boolean;
}

export interface CityWithStateAndCountry extends City {
  state: State & {
    country: Country;
  };
}

export interface CityWithRelations extends City {
  state: State & {
    country: Country;
  };
  populations: Population[];
}

export type ListCitiesQueryParams = ListQueryParams<City>;
export type ListCitiesResult = ListQueryResult<City>;

export type PaginatedListCitiesQueryParams = PaginatedListQueryParams<City>;
export type PaginatedListCitiesResult =
  PaginatedListQueryResult<CityWithStateAndCountry>;
