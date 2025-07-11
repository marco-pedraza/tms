// API types
import { MatchesRegexp, MinLen } from 'encore.dev/validate';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '../../shared/types';
import type {
  CreateInstallationSchemaPayload,
  InstallationSchema,
} from '../installation-schemas/installation-schemas.types';

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

/**
 * Input for synchronizing installation schemas
 * Combines create and update payloads with optional ID to distinguish operations
 */
export interface SyncInstallationSchemaPayload
  extends Omit<CreateInstallationSchemaPayload, 'installationTypeId'> {
  /**
   * Optional ID for existing schemas (null/undefined for new schemas)
   * If provided, the schema will be updated; if not, a new schema will be created
   */
  id?: number | null;
}

export type ListInstallationTypesQueryParams =
  ListQueryParams<InstallationType>;
export type ListInstallationTypesResult = ListQueryResult<InstallationType>;

export type PaginatedListInstallationTypesQueryParams =
  PaginatedListQueryParams<InstallationType>;
export type PaginatedListInstallationTypesResult =
  PaginatedListQueryResult<InstallationType>;

/**
 * Response type for getting installation schemas
 */
export interface GetInstallationSchemaResult {
  /** Array of installation schemas */
  data: InstallationSchema[];
}

/**
 * Response type for syncing installation schemas
 */
export interface SyncInstallationSchemasResult {
  /** Array of synchronized installation schemas */
  data: InstallationSchema[];
}
