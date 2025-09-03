import { MatchesRegexp, MinLen } from 'encore.dev/validate';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '@/shared/types';

/**
 * Base interface representing a technology entity
 */
export interface Technology {
  /** Unique identifier for the technology */
  id: number;

  /** Name of the technology */
  name: string;

  /** Provider of the technology */
  provider: string | null;

  /** Version of the technology */
  version: string | null;

  /** Optional description of the technology */
  description: string | null;

  /** Whether the technology is active/available */
  active: boolean;

  /** Timestamp when the technology record was created */
  createdAt: Date | string;

  /** Timestamp when the technology record was last updated */
  updatedAt: Date | string;

  /** Timestamp when the technology was soft deleted */
  deletedAt: Date | string | null;
}

/**
 * Input for creating a new technology
 */
export interface CreateTechnologyPayload {
  /**
   * Name of the technology
   * Must have at least 1 non-whitespace character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Provider of the technology
   */
  provider?: string | null;

  /**
   * Version of the technology
   */
  version?: string | null;

  /**
   * Optional description of the technology
   */
  description?: string | null;

  /**
   * Whether the technology is active/available
   * @default true
   */
  active?: boolean;
}

/**
 * Input for updating an existing technology
 */
export interface UpdateTechnologyPayload {
  /**
   * Name of the technology
   * Must have at least 1 non-whitespace character
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Provider of the technology
   */
  provider?: string | null;

  /**
   * Version of the technology
   */
  version?: string | null;

  /**
   * Optional description of the technology
   */
  description?: string | null;

  /**
   * Whether the technology is active/available
   */
  active?: boolean;
}

export type ListTechnologiesQueryParams = ListQueryParams<Technology>;
export type ListTechnologiesResult = ListQueryResult<Technology>;

export type PaginatedListTechnologiesQueryParams =
  PaginatedListQueryParams<Technology>;
export type PaginatedListTechnologiesResult =
  PaginatedListQueryResult<Technology>;
