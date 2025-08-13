import { MatchesRegexp, MinLen } from 'encore.dev/validate';
import { PaginatedResult, PaginationParams } from '@/shared/types';
import { Permission } from '../permissions/permissions.types';

/**
 * Base interface representing a role entity
 */
export interface Role {
  /** Unique identifier for the role */
  id: number;

  /** Human-readable name of the role */
  name: string;

  /** Description of what the role represents */
  description: string | null;

  /** ID of the tenant this role belongs to */
  tenantId: number;

  /** Timestamp when the role was created */
  createdAt: Date | string | null;

  /** Timestamp when the role was last updated */
  updatedAt: Date | string | null;
}

/**
 * Role entity with its associated permissions
 */
export interface RoleWithPermissions extends Role {
  /** Permissions associated with this role */
  permissions: Permission[];
}

/**
 * Input for creating a new role
 */
export interface CreateRolePayload {
  /**
   * Human-readable name of the role
   * Must have at least 3 non-whitespace characters
   */
  name: string & MinLen<3> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Description of what the role represents
   */
  description?: string;

  /**
   * ID of the tenant this role belongs to
   */
  tenantId: number;

  /**
   * IDs of permissions to associate with this role
   */
  permissionIds?: number[];
}

/**
 * Input for updating a role
 */
export interface UpdateRolePayload {
  /**
   * Human-readable name of the role
   * Must have at least 3 non-whitespace characters
   */
  name?: string & MinLen<3> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Description of what the role represents
   */
  description?: string;
}

/**
 * Input for assigning permissions to a role
 */
export interface AssignPermissionsToRolePayload {
  /**
   * IDs of permissions to assign to the role
   */
  permissionIds: number[];
}

/**
 * Query options for filtering and ordering roles
 */
export interface RolesQueryOptions {
  orderBy?: { field: keyof Role; direction: 'asc' | 'desc' }[];
  filters?: Partial<Role>;
  includePermissions?: boolean;
}

/**
 * Combined pagination and query options for roles
 */
export interface PaginationParamsRoles
  extends PaginationParams,
    RolesQueryOptions {}

/**
 * Response type for the list roles endpoint
 */
export interface Roles {
  /** List of roles */
  roles: Role[];
}

/**
 * Response type for the list roles with permissions endpoint
 */
export interface RolesWithPermissions {
  /** List of roles with their permissions */
  roles: RoleWithPermissions[];
}

/**
 * Paginated response type for the list roles endpoint
 */
export type PaginatedRoles = PaginatedResult<Role>;

/**
 * Paginated response type for the list roles with permissions endpoint
 */
export type PaginatedRolesWithPermissions =
  PaginatedResult<RoleWithPermissions>;
