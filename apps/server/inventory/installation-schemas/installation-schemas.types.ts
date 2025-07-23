// API types
import { MatchesRegexp, MinLen } from 'encore.dev/validate';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '../../shared/types';

/**
 * Supported field types for installation schemas
 */
export enum InstallationSchemaFieldType {
  STRING = 'string',
  LONG_TEXT = 'long_text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  ENUM = 'enum',
}

/**
 * Configuration options for enum field types only
 */
export interface InstallationSchemaOptions {
  /** For enum type: array of possible values */
  enumValues?: string[];
}

/**
 * Base interface representing an installation schema entity
 */
export interface InstallationSchema {
  /** Unique identifier for the installation schema */
  id: number;

  /** Name of the schema field */
  name: string;

  /** Optional description of the schema field */
  description: string | null;

  /** Type of the field (string, number, boolean, date, enum) */
  type: InstallationSchemaFieldType;

  /** Configuration options for the field (only used for enum type) */
  options: InstallationSchemaOptions;

  /** Whether the field is required */
  required: boolean;

  /** ID of the installation type this schema belongs to */
  installationTypeId: number;

  /** Timestamp when the installation schema record was created */
  createdAt: Date | string | null;

  /** Timestamp when the installation schema record was last updated */
  updatedAt: Date | string | null;
}

/**
 * Installation schema with related installation type data
 */
export interface InstallationSchemaWithRelations extends InstallationSchema {
  /** Related installation type */
  installationType: {
    id: number;
    name: string;
    description: string | null;
  };
}

/**
 * Input for creating a new installation schema
 */
export interface CreateInstallationSchemaPayload {
  /**
   * Name of the schema field
   * Must have at least 1 non-whitespace character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Optional description of the schema field
   */
  description?: string;

  /**
   * Type of the field
   */
  type: InstallationSchemaFieldType;

  /**
   * Configuration options for the field (only required for enum type)
   */
  options?: InstallationSchemaOptions;

  /**
   * Whether the field is required
   * @default false
   */
  required?: boolean;

  /**
   * ID of the installation type this schema belongs to
   */
  installationTypeId: number;
}

/**
 * Input for updating an installation schema
 */
export interface UpdateInstallationSchemaPayload {
  /**
   * Name of the schema field
   * Must have at least 1 non-whitespace character
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Optional description of the schema field
   */
  description?: string;

  /**
   * Type of the field
   */
  type?: InstallationSchemaFieldType;

  /**
   * Configuration options for the field (only required for enum type)
   */
  options?: InstallationSchemaOptions;

  /**
   * Whether the field is required
   */
  required?: boolean;

  /**
   * ID of the installation type this schema belongs to
   */
  installationTypeId?: number;
}

export type ListInstallationSchemasQueryParams =
  ListQueryParams<InstallationSchema>;
export type ListInstallationSchemasResult = ListQueryResult<InstallationSchema>;

export type PaginatedListInstallationSchemasQueryParams =
  PaginatedListQueryParams<InstallationSchema>;
export type PaginatedListInstallationSchemasResult =
  PaginatedListQueryResult<InstallationSchemaWithRelations>;
