import { errors } from '../../shared/errors';
import { userRoles, userPermissions } from './user-permissions.schema';
import { roles } from '../roles/roles.schema';
import { permissions } from '../permissions/permissions.schema';
import type {
  AssignPermissionsToUserPayload,
  AssignRolesToUserPayload,
  UserWithPermissions,
  UserWithRoles,
} from './user-permissions.types';
import { Permission } from '../permissions/permissions.types';
import { Role, RoleWithPermissions } from '../roles/roles.types';
import { permissionRepository } from '../permissions/permissions.repository';
import { roleRepository } from '../roles/roles.repository';
import { userRepository } from '../users/users.repository';
import {
  updateManyToManyRelation,
  getRelatedEntities,
} from '../../shared/db-utils';
import { omitPasswordHash } from '../../shared/auth-utils';

// Error message constants
const ERROR_MESSAGES = {
  PERMISSION_REQUIRED: (code: string) =>
    `User lacks required permission: ${code}`,
  ROLE_REQUIRED: (roleId: number) =>
    `User lacks required role with ID: ${roleId}`,
  USER_NOT_FOUND: (userId: number) => `User with id ${userId} not found`,
};

/**
 * Creates a repository for managing user permissions and roles operations
 * @returns {Object} An object containing user-permissions operations
 */
export const createUserPermissionsRepository = () => {
  /**
   * Assigns roles to a user
   * @param userId - ID of the user
   * @param data - Role IDs to assign
   * @returns User with roles
   * @throws {APIError} If the user or any role is not found
   */
  const assignRoles = async (
    userId: number,
    data: AssignRolesToUserPayload,
  ): Promise<UserWithRoles> => {
    // Validate user exists
    await userRepository.findOne(userId);

    // Validate all roles exist
    await Promise.all(
      data.roleIds.map(async (roleId) => {
        await roleRepository.findOne(roleId);
      }),
    );

    await updateManyToManyRelation(
      userRoles,
      userRoles.userId,
      userId,
      userRoles.roleId,
      data.roleIds,
    );

    return getUserWithRoles(userId);
  };

  /**
   * Assigns permissions directly to a user
   * @param userId - ID of the user
   * @param data - Permission IDs to assign
   * @returns User with permissions
   * @throws {APIError} If the user or any permission is not found
   */
  const assignPermissions = async (
    userId: number,
    data: AssignPermissionsToUserPayload,
  ): Promise<UserWithPermissions> => {
    // Validate user exists
    await userRepository.findOne(userId);

    // Validate all permissions exist
    await Promise.all(
      data.permissionIds.map(async (permissionId) => {
        await permissionRepository.findOne(permissionId);
      }),
    );

    await updateManyToManyRelation(
      userPermissions,
      userPermissions.userId,
      userId,
      userPermissions.permissionId,
      data.permissionIds,
    );

    return getUserWithPermissions(userId);
  };

  /**
   * Gets a user with their assigned roles
   * @param userId - ID of the user
   * @returns User with roles
   * @throws {APIError} If the user is not found
   */
  const getUserWithRoles = async (userId: number): Promise<UserWithRoles> => {
    const user = await userRepository.findOne(userId);

    // Create a safe user object without sensitive data
    const safeUser = omitPasswordHash(user);

    const rolesList = await getRelatedEntities<Role>(
      roles,
      userRoles,
      userRoles.userId,
      userId,
      userRoles.roleId,
    );

    return {
      ...safeUser,
      roles: rolesList,
    };
  };

  /**
   * Gets a user with their assigned permissions
   * @param userId - ID of the user
   * @returns User with permissions
   * @throws {APIError} If the user is not found
   */
  const getUserWithPermissions = async (
    userId: number,
  ): Promise<UserWithPermissions> => {
    const user = await userRepository.findOne(userId);

    // Create a safe user object without sensitive data
    const safeUser = omitPasswordHash(user);

    // Get direct permissions
    const directPermissionsList = await getRelatedEntities<Permission>(
      permissions,
      userPermissions,
      userPermissions.userId,
      userId,
      userPermissions.permissionId,
    );

    // Get roles with permissions
    const userRolesList = await getRelatedEntities<Role>(
      roles,
      userRoles,
      userRoles.userId,
      userId,
      userRoles.roleId,
    );

    let rolesWithPermissions: RoleWithPermissions[] = [];

    if (userRolesList.length > 0) {
      rolesWithPermissions = await Promise.all(
        userRolesList.map(async (role) => {
          return await roleRepository.findOneWithPermissions(role.id);
        }),
      );
    }

    // Extract all permissions from roles
    const rolesPermissions = rolesWithPermissions.flatMap(
      (role) => role.permissions,
    );

    // Calculate effective permissions (direct + from roles, removing duplicates)
    const allPermissions = [...directPermissionsList, ...rolesPermissions];

    // Remove duplicates by ID
    const uniquePermissions = [
      ...new Map(allPermissions.map((p) => [p.id, p])).values(),
    ];

    return {
      ...safeUser,
      directPermissions: directPermissionsList,
      roles: rolesWithPermissions,
      effectivePermissions: uniquePermissions,
      rolesPermissions,
    };
  };

  /**
   * Checks if a user has a specific permission
   * @param userId - ID of the user
   * @param permissionCode - Permission code to check
   * @throws {APIError} If the user doesn't have the required permission
   */
  const hasPermission = async (
    userId: number,
    permissionCode: string,
  ): Promise<void> => {
    try {
      const user = await getUserWithPermissions(userId);

      const hasRequiredPermission = user.effectivePermissions.some(
        (p) => p.code === permissionCode,
      );

      if (!hasRequiredPermission) {
        throw errors.permissionDenied(
          ERROR_MESSAGES.PERMISSION_REQUIRED(permissionCode),
        );
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'APIError') {
        throw error;
      }
      throw errors.notFound(ERROR_MESSAGES.USER_NOT_FOUND(userId));
    }
  };

  /**
   * Checks if a user has a role
   * @param userId - ID of the user
   * @param roleId - Role ID to check
   * @throws {APIError} If the user doesn't have the required role
   */
  const hasRole = async (userId: number, roleId: number): Promise<void> => {
    try {
      const user = await getUserWithRoles(userId);

      const hasRole = user.roles.some((r) => r.id === roleId);

      if (!hasRole) {
        throw errors.permissionDenied(ERROR_MESSAGES.ROLE_REQUIRED(roleId));
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'APIError') {
        throw error;
      }
      throw errors.notFound(ERROR_MESSAGES.USER_NOT_FOUND(userId));
    }
  };

  return {
    assignRoles,
    assignPermissions,
    getUserWithRoles,
    getUserWithPermissions,
    hasPermission,
    hasRole,
  };
};

// Export the user permissions repository instance
export const userPermissionsRepository = createUserPermissionsRepository();
