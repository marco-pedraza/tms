import { MinLen, MatchesRegexp } from 'encore.dev/validate';
import { PaginatedResult } from '../../shared/types';

/**
 * Base interface representing a permission entity
 */
export interface Permission {
  /** Unique identifier for the permission */
  id: number;

  /** Unique code identifier for the permission (e.g., 'CREATE_USER') */
  code: string;

  /** Human-readable name of the permission */
  name: string;

  /** Description of what the permission allows */
  description: string | null;

  /** Timestamp when the permission was created */
  createdAt: Date | null;

  /** Timestamp when the permission was last updated */
  updatedAt: Date | null;
}

/**
 * Input for creating a new permission
 */
export interface CreatePermissionPayload {
  /**
   * Unique code identifier for the permission (e.g., 'CREATE_USER')
   * Must be uppercase with underscores and at least 3 characters
   */
  code: string & MinLen<3>;

  /**
   * Human-readable name of the permission
   * Must have at least 3 non-whitespace characters
   */
  name: string & MinLen<3>;

  /**
   * Description of what the permission allows
   */
  description?: string;
}

/**
 * Input for updating a permission
 */
export interface UpdatePermissionPayload {
  /**
   * Human-readable name of the permission
   * Must have at least 3 non-whitespace characters
   */
  name?: string & MinLen<3> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Description of what the permission allows
   */
  description?: string;
}

/**
 * Response type for the list permissions endpoint
 */
export interface Permissions {
  /** List of permissions */
  permissions: Permission[];
}

/**
 * Paginated response type for the list permissions endpoint
 */
export type PaginatedPermissions = PaginatedResult<Permission>;
