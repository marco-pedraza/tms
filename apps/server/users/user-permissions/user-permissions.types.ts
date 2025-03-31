import { Permission } from '../permissions/permissions.types';
import { Role, RoleWithPermissions } from '../roles/roles.types';
import { SafeUser } from '../users/users.types';

/**
 * Interface for assigning permissions directly to a user
 */
export interface AssignPermissionsToUserPayload {
  /**
   * IDs of permissions to assign to the user
   */
  permissionIds: number[];
}

/**
 * Interface for assigning roles to a user
 */
export interface AssignRolesToUserPayload {
  /**
   * IDs of roles to assign to the user
   */
  roleIds: number[];
}

/**
 * Interface for a user with their assigned roles
 */
export interface UserWithRoles extends SafeUser {
  /**
   * Roles assigned to this user
   */
  roles: Role[];
}

/**
 * Interface for a user with their assigned permissions
 * (both directly assigned and inherited from roles)
 */
export interface UserWithPermissions extends SafeUser {
  /**
   * Directly assigned permissions
   */
  directPermissions: Permission[];

  /**
   * Roles assigned to this user, including their permissions
   */
  roles: RoleWithPermissions[];

  /**
   * Permissions that came from roles only
   */
  rolesPermissions: Permission[];

  /**
   * All effective permissions (combined from direct assignments and roles)
   */
  effectivePermissions: Permission[];
}

/**
 * Simplified interface for a user with only a flat list of permissions
 * without separating role-based and direct permissions
 */
export interface UserWithFlatPermissions extends SafeUser {
  /**
   * All unique permissions the user has (combined from direct assignments and roles)
   */
  permissions: Permission[];
}
