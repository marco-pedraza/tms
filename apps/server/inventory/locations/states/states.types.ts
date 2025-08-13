// API types
import { MatchesRegexp, Min, MinLen } from 'encore.dev/validate';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '@/shared/types';

/**
 * Base interface representing a state entity
 */
export interface State {
  /** Unique identifier for the state */
  id: number;

  /** Name of the state */
  name: string;

  /** State code (e.g., "TX", "CA", "NY") */
  code: string;

  /** ID of the country this state belongs to */
  countryId: number;

  /** Whether the state is currently active in the system */
  active: boolean;

  /** Timestamp when the state record was created */
  createdAt: Date | string | null;

  /** Timestamp when the state record was last updated */
  updatedAt: Date | string | null;
}

/**
 * Input for creating a new state
 */
export interface CreateStatePayload {
  /**
   * Name of the state
   * Must have at least 1 non-whitespace character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * State code (e.g., "TX", "CA", "NY")
   * Must have at least 1 non-whitespace character
   */
  code: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * ID of the country this state belongs to
   * Must be a positive number
   */
  countryId: number & Min<1>;

  /**
   * Whether the state is active
   * @default true
   */
  active?: boolean;
}

/**
 * Input for updating a state
 */
export interface UpdateStatePayload {
  /**
   * Name of the state
   * Must have at least 1 non-whitespace character
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * State code (e.g., "TX", "CA", "NY")
   * Must have at least 1 non-whitespace character
   */
  code?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * ID of the country this state belongs to
   * Must be a positive number
   */
  countryId?: number & Min<1>;

  /**
   * Whether the state is active
   */
  active?: boolean;
}

export type ListStatesQueryParams = ListQueryParams<State>;
export type ListStatesResult = ListQueryResult<State>;

export type PaginatedListStatesQueryParams = PaginatedListQueryParams<State>;
export type PaginatedListStatesResult = PaginatedListQueryResult<State>;
