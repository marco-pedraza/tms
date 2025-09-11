import { MatchesRegexp, Min, MinLen } from 'encore.dev/validate';
import type {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '@/shared/types';

/**
 * Base interface representing an event type entity
 */
export interface EventType {
  /** Unique identifier for the event type */
  id: number;

  /** Name of the event type */
  name: string;

  /** Unique code for the event type */
  code: string;

  /** Optional description of the event type */
  description: string | null;

  /** Base time in minutes for this event type */
  baseTime: number;

  /** Whether this event type requires cost tracking */
  needsCost: boolean;

  /** Whether this event type requires quantity tracking */
  needsQuantity: boolean;

  /** Whether this is an integration event type */
  integration: boolean;

  /** Whether the event type is active */
  active: boolean;

  /** Timestamp when the event type was created */
  createdAt: Date | string | null;

  /** Timestamp when the event type was last updated */
  updatedAt: Date | string | null;
}

/**
 * Payload for creating a new event type
 */
export interface CreateEventTypePayload {
  /**
   * Name of the event type (required, non-empty)
   * Must have at least 1 non-whitespace character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Unique code for the event type (required, non-empty)
   * Must have at least 1 non-whitespace character
   */
  code: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Optional description of the event type
   */
  description?: string;

  /**
   * Base time in minutes (optional, defaults to 0, must be non-negative integer)
   * @minimum 0
   * @default 0
   */
  baseTime?: number & Min<0>;

  /**
   * Whether this event type requires cost tracking (defaults to false)
   * @default false
   */
  needsCost?: boolean;

  /**
   * Whether this event type requires quantity tracking (defaults to false)
   * @default false
   */
  needsQuantity?: boolean;

  /**
   * Whether this event type is part of system integration
   * @default false
   */
  integration?: boolean;

  /**
   * Whether this event type is active
   * @default true
   */
  active?: boolean;
}

/**
 * Payload for updating an existing event type
 */
export interface UpdateEventTypePayload {
  /**
   * Name of the event type (optional, but if provided must be non-empty)
   * Must have at least 1 non-whitespace character
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Unique code for the event type (optional, but if provided must be non-empty)
   * Must have at least 1 non-whitespace character
   */
  code?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Optional description of the event type
   */
  description?: string;

  /**
   * Base time in minutes (optional, but if provided must be non-negative integer)
   * @minimum 0
   * @default 0
   */
  baseTime?: number & Min<0>;

  /**
   * Whether this event type requires cost tracking
   */
  needsCost?: boolean;

  /**
   * Whether this event type requires quantity tracking
   */
  needsQuantity?: boolean;

  /**
   * Whether this event type is part of system integration
   */
  integration?: boolean;

  /**
   * Whether this event type is active
   */
  active?: boolean;
}

export type ListEventTypesQueryParams = ListQueryParams<EventType>;
export type ListEventTypesResult = ListQueryResult<EventType>;

export type PaginatedListEventTypesQueryParams =
  PaginatedListQueryParams<EventType>;
export type PaginatedListEventTypesResult = PaginatedListQueryResult<EventType>;
