import { api } from 'encore.dev/api';
import { ValidationError } from '@repo/base-repo';
import type {
  AssignPermissionsToUserPayload,
  AssignRolesToUserPayload,
  UserWithPermissions,
  UserWithRoles,
} from './user-permissions.types';
import { userPermissionsRepository } from './user-permissions.repository';

/**
 * Retrieves a user with their assigned roles.
 * @param params - Object containing the user ID
 * @param params.userId - The ID of the user to retrieve
 * @returns {Promise<UserWithRoles>} The user with their roles
 * @throws {APIError} If the user is not found or retrieval fails
 */
export const getUserWithRoles = api(
  {
    expose: true,
    method: 'GET',
    path: '/users/:userId/roles',
    auth: true,
  },
  async ({ userId }: { userId: number }): Promise<UserWithRoles> => {
    // Validate userId first
    if (!userId || isNaN(Number(userId))) {
      throw new ValidationError('Invalid user ID provided');
    }

    return await userPermissionsRepository.getUserWithRoles(userId);
  },
);

/**
 * Retrieves a user with their assigned permissions.
 * @param params - Object containing the user ID
 * @param params.userId - The ID of the user to retrieve
 * @returns {Promise<UserWithPermissions>} The user with their permissions
 * @throws {APIError} If the user is not found or retrieval fails
 */
export const getUserWithPermissions = api(
  {
    expose: true,
    method: 'GET',
    path: '/users/:userId/permissions',
    auth: true,
  },
  async ({ userId }: { userId: number }): Promise<UserWithPermissions> => {
    return await userPermissionsRepository.getUserWithPermissions(userId);
  },
);

/**
 * Assigns roles to a user.
 * @param params - Object containing the user ID and role IDs
 * @param params.userId - The ID of the user
 * @param params.roleIds - The IDs of the roles to assign
 * @returns {Promise<UserWithRoles>} The user with updated roles
 * @throws {APIError} If the user is not found or assignment fails
 */
export const assignRolesToUser = api(
  {
    expose: true,
    method: 'POST',
    path: '/users/:userId/roles',
    auth: true,
  },
  async ({
    userId,
    ...data
  }: AssignRolesToUserPayload & { userId: number }): Promise<UserWithRoles> => {
    return await userPermissionsRepository.assignRoles(userId, data);
  },
);

/**
 * Assigns permissions directly to a user.
 * @param params - Object containing the user ID and permission IDs
 * @param params.userId - The ID of the user
 * @param params.permissionIds - The IDs of the permissions to assign
 * @returns {Promise<UserWithPermissions>} The user with updated permissions
 * @throws {APIError} If the user is not found or assignment fails
 */
export const assignPermissionsToUser = api(
  {
    expose: true,
    method: 'POST',
    path: '/users/:userId/permissions',
    auth: true,
  },
  async ({
    userId,
    ...data
  }: AssignPermissionsToUserPayload & {
    userId: number;
  }): Promise<UserWithPermissions> => {
    return await userPermissionsRepository.assignPermissions(userId, data);
  },
);

/**
 * Checks if a user has a specific permission.
 * @param params - Object containing the user ID and permission code
 * @param params.userId - The ID of the user
 * @param params.permissionCode - The code of the permission to check
 * @returns {Promise<{hasPermission: boolean}>} Whether the user has the permission
 * @throws {APIError} If permission check fails or the user is unauthorized
 */
export const checkUserPermission = api(
  {
    expose: true,
    method: 'GET',
    path: '/users/:userId/permissions/:permissionCode/check',
    auth: true,
  },
  async ({
    userId,
    permissionCode,
  }: {
    userId: number;
    permissionCode: string;
  }): Promise<{ hasPermission: boolean }> => {
    try {
      await userPermissionsRepository.hasPermission(userId, permissionCode);
      return { hasPermission: true };
    } catch (error) {
      // If it's an UnauthorizedError or NotFoundError, return false without throwing
      if (
        error instanceof Error &&
        (error.name === 'UnauthorizedError' || error.name === 'NotFoundError')
      ) {
        return { hasPermission: false };
      }
      throw error;
    }
  },
);

/**
 * Checks if a user has a specific role.
 * @param params - Object containing the user ID and role ID
 * @param params.userId - The ID of the user
 * @param params.roleId - The ID of the role to check
 * @returns {Promise<{hasRole: boolean}>} Whether the user has the role
 * @throws {APIError} If role check fails or the user is unauthorized
 */
export const checkUserRole = api(
  {
    expose: true,
    method: 'GET',
    path: '/users/:userId/roles/:roleId/check',
    auth: true,
  },
  async ({
    userId,
    roleId,
  }: {
    userId: number;
    roleId: number;
  }): Promise<{ hasRole: boolean }> => {
    try {
      await userPermissionsRepository.hasRole(userId, roleId);
      return { hasRole: true };
    } catch (error) {
      // If it's an UnauthorizedError or NotFoundError, return false without throwing
      if (
        error instanceof Error &&
        (error.name === 'UnauthorizedError' || error.name === 'NotFoundError')
      ) {
        return { hasRole: false };
      }
      throw error;
    }
  },
);

/**
 * Retrieves a user with their effective permissions (combined from direct assignments and roles).
 * @param params - Object containing the user ID
 * @param params.userId - The ID of the user to retrieve
 * @returns {Promise<UserWithPermissions>} The user with their effective permissions
 * @throws {APIError} If the user is not found or retrieval fails
 */
export const getUserPermissions = api(
  {
    expose: true,
    method: 'GET',
    path: '/users/:userId/effective-permissions',
    auth: true,
  },
  async ({ userId }: { userId: number }): Promise<UserWithPermissions> => {
    return await userPermissionsRepository.getUserWithPermissions(userId);
  },
);

/**
 * Retrieves a user with their roles.
 * @param params - Object containing the user ID
 * @param params.userId - The ID of the user to retrieve
 * @returns {Promise<UserWithRoles>} The user with their roles
 * @throws {APIError} If the user is not found or retrieval fails
 */
export const getUserRoles = api(
  {
    expose: true,
    method: 'GET',
    path: '/users/:userId/assigned-roles',
    auth: true,
  },
  async ({ userId }: { userId: number }): Promise<UserWithRoles> => {
    return await userPermissionsRepository.getUserWithRoles(userId);
  },
);
