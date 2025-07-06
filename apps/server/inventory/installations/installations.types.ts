// API types
import { MatchesRegexp, Min, MinLen } from 'encore.dev/validate';
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

  /** Contact phone number for the installation */
  contactPhone: string | null;

  /** Contact email address for the installation */
  contactEmail: string | null;

  /** Website URL for the installation */
  website: string | null;

  /** ID of the installation type this installation belongs to */
  installationTypeId: number | null;

  /** Timestamp when the installation record was created */
  createdAt: Date | null;

  /** Timestamp when the installation record was last updated */
  updatedAt: Date | null;
}

/**
 * Location information for an installation
 */
export interface InstallationLocation {
  /** Latitude coordinate of the installation */
  latitude: number;

  /** Longitude coordinate of the installation */
  longitude: number;

  /** Radius of coverage for the installation in meters */
  radius: number;
}

/**
 * Installation with location information from the associated node
 */
export interface InstallationWithLocation extends Installation {
  /** Location information from the associated node */
  location: InstallationLocation | null;
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

  /**
   * Optional contact phone number for the installation
   * Must match phone number format if provided
   */
  contactPhone?: (string & MatchesRegexp<'^[+]?[1-9][\\d]{0,15}$'>) | null;

  /**
   * Optional contact email address for the installation
   * Must be a valid email format if provided
   */
  contactEmail?:
    | (string & MatchesRegexp<'^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'>)
    | null;

  /**
   * Optional website URL for the installation
   * Must be a valid URL starting with http:// or https:// if provided
   */
  website?:
    | (string & MatchesRegexp<'^https?:\\/\\/[^\\s/$.?#].[^\\s]*$'>)
    | null;

  /**
   * ID of the installation type this installation belongs to
   * Must be a positive number
   */
  installationTypeId: (number & Min<1>) | null;
}

/**
 * Input for creating a new installation associated with a node
 */
export interface CreateNodeInstallationPayload {
  /**
   * ID of the node to associate the installation with
   * Must be a positive number
   */
  nodeId: number & Min<1>;

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

  /**
   * Optional contact phone number for the installation
   * Must match phone number format if provided
   */
  contactPhone?: (string & MatchesRegexp<'^[+]?[1-9][\\d]{0,15}$'>) | null;

  /**
   * Optional contact email address for the installation
   * Must be a valid email format if provided
   */
  contactEmail?:
    | (string & MatchesRegexp<'^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'>)
    | null;

  /**
   * Optional website URL for the installation
   * Must be a valid URL starting with http:// or https:// if provided
   */
  website?:
    | (string & MatchesRegexp<'^https?:\\/\\/[^\\s/$.?#].[^\\s]*$'>)
    | null;

  /**
   * Optional ID of the installation type this installation belongs to
   * Must be a positive number if provided
   */
  installationTypeId?: (number & Min<1>) | null;
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

  /**
   * Optional contact phone number for the installation
   * Must match phone number format if provided
   */
  contactPhone?: (string & MatchesRegexp<'^[+]?[1-9][\\d]{0,15}$'>) | null;

  /**
   * Optional contact email address for the installation
   * Must be a valid email format if provided
   */
  contactEmail?:
    | (string & MatchesRegexp<'^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'>)
    | null;

  /**
   * Optional website URL for the installation
   * Must be a valid URL starting with http:// or https:// if provided
   */
  website?:
    | (string & MatchesRegexp<'^https?:\\/\\/[^\\s/$.?#].[^\\s]*$'>)
    | null;

  /**
   * ID of the installation type this installation belongs to
   * Must be a positive number
   */
  installationTypeId?: (number & Min<1>) | null;
}

export type ListInstallationsQueryParams = ListQueryParams<Installation>;
export type ListInstallationsResult = ListQueryResult<Installation>;

export type PaginatedListInstallationsQueryParams =
  PaginatedListQueryParams<Installation>;
export type PaginatedListInstallationsResult =
  PaginatedListQueryResult<InstallationWithLocation>;
