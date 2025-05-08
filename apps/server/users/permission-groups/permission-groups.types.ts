import { MinLen, MatchesRegexp } from 'encore.dev/validate';
import { Permission } from '../permissions/permissions.types';

/**
 * Base interface representing a permission group entity
 */
export interface PermissionGroup {
  /** Unique identifier for the permission group */
  id: number;

  /** Name of the permission group */
  name: string;

  /** Optional description for the permission group */
  description?: string | null;

  /** Timestamp when the permission group record was created */
  createdAt: Date | null;

  /** Timestamp when the permission group record was last updated */
  updatedAt: Date | null;

  /** Array of permissions associated with this group (optional for flexibility) */
  permissions?: Permission[];
}

/**
 * Input for creating a new permission group
 */
export interface CreatePermissionGroupPayload {
  /**
   * Name of the permission group
   * Must have at least 1 non-whitespace character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /** Optional description for the permission group */
  description?: string | null;

  /** Optional array of permission IDs to associate with the group */
  permissionIds?: number[];
}

/**
 * Input for updating a permission group
 */
export interface UpdatePermissionGroupPayload {
  /**
   * Name of the permission group
   * Must have at least 1 non-whitespace character
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /** Optional description for the permission group */
  description?: string | null;

  /** Optional array of permission IDs to associate with the group */
  permissionIds?: number[];
}

/**
 * Response type for the list permission groups endpoint
 */
export interface PermissionGroups {
  /** List of permission groups with their associated permissions */
  permissionGroups: PermissionGroup[];
}
