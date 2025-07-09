// API types
import { MatchesRegexp, Min, MinLen } from 'encore.dev/validate';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '../../shared/types';
import { InstallationSchemaOptions } from '../installation-schemas/installation-schemas.types';

/**
 * Base interface representing an installation property entity
 */
export interface InstallationProperty {
  /** Unique identifier for the installation property */
  id: number;

  /** Value of the property (stored as string) */
  value: string;

  /** ID of the installation this property belongs to */
  installationId: number;

  /** ID of the installation schema this property is based on */
  installationSchemaId: number;

  /** Timestamp when the installation property record was created */
  createdAt: Date | null;

  /** Timestamp when the installation property record was last updated */
  updatedAt: Date | null;

  /** Timestamp when the installation property record was soft deleted */
  deletedAt: Date | null;
}

/**
 * Installation property with related installation schema information
 */
export interface InstallationPropertyWithSchema extends InstallationProperty {
  /** Related installation schema information */
  installationSchema: {
    id: number;
    name: string;
    label: string;
    description: string | null;
    type: string;
    required: boolean;
    options: InstallationSchemaOptions;
  };
}

/**
 * Input for creating a new installation property
 */
export interface CreateInstallationPropertyPayload {
  /**
   * Value of the property (stored as string)
   * Must have at least 1 non-whitespace character
   */
  value: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * ID of the installation this property belongs to
   * Must be a positive number
   */
  installationId: number & Min<1>;

  /**
   * ID of the installation schema this property is based on
   * Must be a positive number
   */
  installationSchemaId: number & Min<1>;
}

/**
 * Input for updating an installation property
 */
export interface UpdateInstallationPropertyPayload {
  /**
   * Value of the property (stored as string)
   * Must have at least 1 non-whitespace character
   */
  value?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * ID of the installation this property belongs to
   * Must be a positive number
   */
  installationId?: number & Min<1>;

  /**
   * ID of the installation schema this property is based on
   * Must be a positive number
   */
  installationSchemaId?: number & Min<1>;
}

export type ListInstallationPropertiesQueryParams =
  ListQueryParams<InstallationProperty>;
export type ListInstallationPropertiesResult =
  ListQueryResult<InstallationProperty>;

export type PaginatedListInstallationPropertiesQueryParams =
  PaginatedListQueryParams<InstallationProperty>;
export type PaginatedListInstallationPropertiesResult =
  PaginatedListQueryResult<InstallationProperty>;

/**
 * Input for a single property to be validated and transformed
 */
export interface PropertyInput {
  /** Name of the property that should match a schema name */
  name: string;
  /** Raw value as string that needs to be cast to the appropriate type */
  value: string;
}

/**
 * Property paired with its schema for easier validation and casting
 */
export interface PropertyWithSchema {
  /** Name of the property */
  name: string;
  /** Raw value from input (before validation/casting) */
  value: string;
  /** The schema that will be used for validation and casting */
  schema: {
    id: number;
    name: string;
    label: string;
    type: string;
    required: boolean;
    options: InstallationSchemaOptions;
  };
}

/**
 * Input for upserting installation properties
 * Used after validation and transformation
 */
export interface UpsertInstallationPropertiesPayload {
  /** ID of the installation */
  installationId: number;
  /** Array of validated properties ready for database operations */
  properties: PropertyWithSchema[];
}
