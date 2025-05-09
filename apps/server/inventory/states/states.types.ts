// API types
import { MinLen, MatchesRegexp, Min } from 'encore.dev/validate';
import { PaginatedResult, PaginationParams } from '../../shared/types';

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
  createdAt: Date | null;

  /** Timestamp when the state record was last updated */
  updatedAt: Date | null;
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

/**
 * Response type for the list states endpoint
 */
export interface States {
  /** List of states */
  states: State[];
}

export interface StatesQueryOptions {
  orderBy?: { field: keyof State; direction: 'asc' | 'desc' }[];
  filters?: Partial<State>;
}

/**
 * Paginated response type for the list states endpoint
 */
export type PaginatedStates = PaginatedResult<State>;

export interface PaginationParamsStates
  extends PaginationParams,
    StatesQueryOptions {}
