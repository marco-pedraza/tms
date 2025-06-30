// API types
import { MatchesRegexp, MinLen } from 'encore.dev/validate';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '../../shared/types';

/**
 * Base interface representing an installation entity
 */
export interface Installation {
  /** Unique identifier for the installation */
  id: number;

  /** Name of the installation */
  name: string;

  /** Physical address of the installation */
  address: string;

  /** Optional description of the installation */
  description: string | null;

  /** Timestamp when the installation record was created */
  createdAt: Date | null;

  /** Timestamp when the installation record was last updated */
  updatedAt: Date | null;
}

/**
 * Input for creating a new installation
 * Note: This is used internally by the system (e.g., when creating installations through nodes)
 * There is no public endpoint for creating installations independently
 */
export interface CreateInstallationPayload {
  /**
   * Name of the installation
   * Must have at least 1 non-whitespace character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Physical address of the installation
   * Must have at least 1 non-whitespace character
   */
  address: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Optional description of the installation
   */
  description?: string | null;
}

/**
 * Input for updating an installation
 */
export interface UpdateInstallationPayload {
  /**
   * Name of the installation
   * Must have at least 1 non-whitespace character
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Physical address of the installation
   * Must have at least 1 non-whitespace character
   */
  address?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Optional description of the installation
   */
  description?: string | null;
}

export type ListInstallationsQueryParams = ListQueryParams<Installation>;
export type ListInstallationsResult = ListQueryResult<Installation>;

export type PaginatedListInstallationsQueryParams =
  PaginatedListQueryParams<Installation>;
export type PaginatedListInstallationsResult =
  PaginatedListQueryResult<Installation>;
