import { MatchesRegexp, MinLen } from 'encore.dev/validate';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '@/shared/types';
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

  /** Whether the role is active */
  active: boolean;

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
   * IDs of permissions to associate with this role
   */
  permissionIds?: number[];

  /**
   * Whether the role is active
   * @default true
   */
  active?: boolean;
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

  /**
   * Whether the role is active
   */
  active?: boolean;
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
export interface RoleQueryOptions {
  includePermissions?: boolean;
}

export type ListRolesQueryParams = ListQueryParams<Role> & RoleQueryOptions;
export type ListRolesResult = ListQueryResult<Role | RoleWithPermissions>;

export type PaginatedListRolesQueryParams = PaginatedListQueryParams<Role> &
  RoleQueryOptions;
export type PaginatedListRolesResult = PaginatedListQueryResult<
  Role | RoleWithPermissions
>;
