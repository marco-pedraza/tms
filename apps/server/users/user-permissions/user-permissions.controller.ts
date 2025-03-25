import { api } from 'encore.dev/api';
import { userPermissionsHandler } from './user-permissions.handler';
import type {
  AssignPermissionsToUserPayload,
  AssignRolesToUserPayload,
  UserWithPermissions,
  UserWithRoles,
} from './user-permissions.types';
import { parseApiError } from '../../shared/errors';

/**
 * Retrieves a user with their assigned roles.
 * @param params - Object containing the user ID
 * @param params.userId - The ID of the user to retrieve
 * @returns {Promise<UserWithRoles>} The user with their roles
 * @throws {APIError} If the user is not found or retrieval fails
 */
export const getUserWithRoles = api(
  { method: 'GET', path: '/users/:userId/roles', expose: true },
  async ({ userId }: { userId: number }): Promise<UserWithRoles> => {
    try {
      return await userPermissionsHandler.getUserWithRoles(userId);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
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
  { method: 'GET', path: '/users/:userId/permissions', expose: true },
  async ({ userId }: { userId: number }): Promise<UserWithPermissions> => {
    try {
      return await userPermissionsHandler.getUserWithPermissions(userId);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
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
  { method: 'POST', path: '/users/:userId/roles', expose: true },
  async ({
    userId,
    ...data
  }: AssignRolesToUserPayload & { userId: number }): Promise<UserWithRoles> => {
    try {
      return await userPermissionsHandler.assignRoles(userId, data);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
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
  { method: 'POST', path: '/users/:userId/permissions', expose: true },
  async ({
    userId,
    ...data
  }: AssignPermissionsToUserPayload & {
    userId: number;
  }): Promise<UserWithPermissions> => {
    try {
      return await userPermissionsHandler.assignPermissions(userId, data);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
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
    method: 'GET',
    path: '/users/:userId/permissions/:permissionCode/check',
    expose: true,
  },
  async ({
    userId,
    permissionCode,
  }: {
    userId: number;
    permissionCode: string;
  }): Promise<{ hasPermission: boolean }> => {
    try {
      await userPermissionsHandler.hasPermission(userId, permissionCode);
      return { hasPermission: true };
    } catch (error) {
      // If it's an UnauthorizedError or NotFoundError, return false without throwing
      // For other errors, rethrow as APIError
      if (
        error instanceof Error &&
        (error.name === 'UnauthorizedError' || error.name === 'NotFoundError')
      ) {
        return { hasPermission: false };
      }
      const parsedError = parseApiError(error);
      throw parsedError;
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
  { method: 'GET', path: '/users/:userId/roles/:roleId/check', expose: true },
  async ({
    userId,
    roleId,
  }: {
    userId: number;
    roleId: number;
  }): Promise<{ hasRole: boolean }> => {
    try {
      await userPermissionsHandler.hasRole(userId, roleId);
      return { hasRole: true };
    } catch (error) {
      // If it's an UnauthorizedError or NotFoundError, return false without throwing
      // For other errors, rethrow as APIError
      if (
        error instanceof Error &&
        (error.name === 'UnauthorizedError' || error.name === 'NotFoundError')
      ) {
        return { hasRole: false };
      }
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);
