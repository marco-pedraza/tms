// API types
import { MatchesRegexp, MinLen } from 'encore.dev/validate';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '@/shared/types';
import type { EventType } from '@/inventory/locations/event-types/event-types.types';
import type { CreateInstallationSchemaPayload } from '@/inventory/locations/installation-schemas/installation-schemas.types';

/**
 * Base interface representing an installation type entity
 */
export interface InstallationType {
  /** Unique identifier for the installation type */
  id: number;

  /** Name of the installation type */
  name: string;

  /** Code of the installation type */
  code: string;

  /** Optional description of the installation type */
  description: string | null;

  /**
   * Whether this installation type is system-locked
   * System-locked types cannot be modified or deleted through the API
   * @default false
   */
  systemLocked: boolean;

  /** Whether the installation type is active */
  active: boolean;

  /** Timestamp when the installation type record was created */
  createdAt: Date | string | null;

  /** Timestamp when the installation type record was last updated */
  updatedAt: Date | string | null;
}

/**
 * Installation type entity with its related event types
 */
export interface InstallationTypeWithRelations extends InstallationType {
  /** Array of event types assigned to this installation type */
  eventTypes: EventType[];
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
   * Code of the installation type
   * Must have at least 1 non-whitespace character
   */
  code: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Optional description of the installation type
   */
  description?: string | null;

  /**
   * Whether the installation type is active
   * @default true
   */
  active?: boolean;
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
   * Code of the installation type
   * Must have at least 1 non-whitespace character
   */
  code?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Optional description of the installation type
   */
  description?: string | null;

  /**
   * Whether the installation type is active
   * @default true
   */
  active?: boolean;
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

/**
 * Payload for assigning multiple event types to an installation type
 */
export interface AssignEventTypesToInstallationTypePayload {
  /** Array of event type IDs to assign */
  eventTypeIds: number[];
}

// List and pagination types
export type ListInstallationTypesQueryParams =
  ListQueryParams<InstallationType>;
export type ListInstallationTypesResult = ListQueryResult<InstallationType>;

export type PaginatedListInstallationTypesQueryParams =
  PaginatedListQueryParams<InstallationType>;
export type PaginatedListInstallationTypesResult =
  PaginatedListQueryResult<InstallationType>;
