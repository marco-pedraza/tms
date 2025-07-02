// API types
import { MatchesRegexp, MinLen } from 'encore.dev/validate';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '../../shared/types';

/**
 * Base interface representing an installation type entity
 */
export interface InstallationType {
  /** Unique identifier for the installation type */
  id: number;

  /** Name of the installation type */
  name: string;

  /** Optional description of the installation type */
  description: string | null;

  /** Timestamp when the installation type record was created */
  createdAt: Date | null;

  /** Timestamp when the installation type record was last updated */
  updatedAt: Date | null;
}

/**
 * Input for creating a new installation type
 */
export interface CreateInstallationTypePayload {
  /**
   * Name of the installation type
   * Must have at least 1 non-whitespace character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Optional description of the installation type
   */
  description?: string | null;
}

/**
 * Input for updating an installation type
 */
export interface UpdateInstallationTypePayload {
  /**
   * Name of the installation type
   * Must have at least 1 non-whitespace character
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Optional description of the installation type
   */
  description?: string | null;
}

export type ListInstallationTypesQueryParams =
  ListQueryParams<InstallationType>;
export type ListInstallationTypesResult = ListQueryResult<InstallationType>;

export type PaginatedListInstallationTypesQueryParams =
  PaginatedListQueryParams<InstallationType>;
export type PaginatedListInstallationTypesResult =
  PaginatedListQueryResult<InstallationType>;
