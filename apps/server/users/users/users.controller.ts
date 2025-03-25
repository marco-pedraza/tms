import { api } from 'encore.dev/api';
import { userHandler } from './users.handler';
import type {
  CreateUserPayload,
  UpdateUserPayload,
  ChangePasswordPayload,
  SafeUser,
  Users,
  PaginatedUsers,
} from './users.types';
import { parseApiError } from '../../shared/errors';
import { PaginationParams } from '../../shared/types';

//TODO Check if controllers can be switched to class, or handler to functions.

/**
 * Creates a new user.
 * @param params - The user data to create
 * @returns {Promise<SafeUser>} The created user (without sensitive data)
 * @throws {APIError} If the user creation fails
 */
export const createUser = api(
  { method: 'POST', path: '/users', expose: true },
  async (params: CreateUserPayload): Promise<SafeUser> => {
    try {
      return await userHandler.create(params);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Retrieves a user by ID.
 * @param params - Object containing the user ID
 * @param params.id - The ID of the user to retrieve
 * @returns {Promise<SafeUser>} The found user (without sensitive data)
 * @throws {APIError} If the user is not found or retrieval fails
 */
export const getUser = api(
  { method: 'GET', path: '/users/:id', expose: true },
  async ({ id }: { id: number }): Promise<SafeUser> => {
    try {
      return await userHandler.findOne(id);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Retrieves all users.
 * @returns {Promise<Users>} List of all users (without sensitive data)
 * @throws {APIError} If the retrieval fails
 */
export const listUsers = api(
  { method: 'GET', path: '/users', expose: true },
  async (): Promise<Users> => {
    try {
      return await userHandler.findAll();
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Retrieves all users for a specific tenant.
 * @param params - Object containing the tenant ID
 * @param params.tenantId - The ID of the tenant
 * @returns {Promise<Users>} List of users for the tenant (without sensitive data)
 * @throws {APIError} If the retrieval fails
 */
export const listTenantUsers = api(
  { method: 'GET', path: '/tenants/:tenantId/users', expose: true },
  async ({ tenantId }: { tenantId: number }): Promise<Users> => {
    try {
      return await userHandler.findByTenant(tenantId);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Updates an existing user.
 * @param params - Object containing the user ID and update data
 * @param params.id - The ID of the user to update
 * @returns {Promise<SafeUser>} The updated user (without sensitive data)
 * @throws {APIError} If the user is not found or update fails
 */
export const updateUser = api(
  { method: 'PUT', path: '/users/:id', expose: true },
  async ({
    id,
    ...data
  }: UpdateUserPayload & { id: number }): Promise<SafeUser> => {
    try {
      return await userHandler.update(id, data);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Changes a user's password.
 * @param params - Object containing the user ID and password data
 * @param params.id - The ID of the user
 * @param params.currentPassword - The current password for verification
 * @param params.newPassword - The new password to set
 * @returns {Promise<SafeUser>} The updated user (without sensitive data)
 * @throws {APIError} If the user is not found, current password is incorrect, or change fails
 */
export const changePassword = api(
  { method: 'POST', path: '/users/:id/change-password', expose: true },
  async ({
    id,
    ...data
  }: ChangePasswordPayload & { id: number }): Promise<SafeUser> => {
    try {
      return await userHandler.changePassword(id, data);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Deletes a user by ID.
 * @param params - Object containing the user ID
 * @param params.id - The ID of the user to delete
 * @returns {Promise<SafeUser>} The deleted user (without sensitive data)
 * @throws {APIError} If the user is not found or deletion fails
 */
export const deleteUser = api(
  { method: 'DELETE', path: '/users/:id', expose: true },
  async ({ id }: { id: number }): Promise<SafeUser> => {
    try {
      return await userHandler.delete(id);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Retrieves users with pagination.
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedUsers>} Paginated list of users
 * @throws {APIError} If retrieval fails
 */
export const listUsersWithPagination = api(
  { method: 'GET', path: '/users/paginated', expose: true },
  async (params: PaginationParams): Promise<PaginatedUsers> => {
    try {
      return await userHandler.findAllPaginated(params);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Retrieves users for a specific tenant with pagination.
 * @param params - Object containing the tenant ID and pagination parameters
 * @param params.tenantId - The ID of the tenant to retrieve users for
 * @returns {Promise<PaginatedUsers>} Paginated list of users for the tenant
 * @throws {APIError} If retrieval fails
 */
export const listTenantUsersWithPagination = api(
  { method: 'GET', path: '/tenants/:tenantId/users/paginated', expose: true },
  async ({
    tenantId,
    ...paginationParams
  }: { tenantId: number } & PaginationParams): Promise<PaginatedUsers> => {
    try {
      return await userHandler.findByTenantPaginated(
        tenantId,
        paginationParams,
      );
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);
