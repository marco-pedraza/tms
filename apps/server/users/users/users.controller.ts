import { api } from 'encore.dev/api';
import { userRepository } from './users.repository';
import type {
  CreateUserPayload,
  UpdateUserPayload,
  SafeUser,
  Users,
  PaginatedUsers,
  ChangePasswordPayload,
} from './users.types';
import { createControllerErrorHandler } from '../../shared/controller-utils';
import { PaginationParams } from '../../shared/types';
import { userUseCases } from './users.use-cases';

const withErrorHandling = createControllerErrorHandler('UsersController');

/**
 * Creates a new user
 * @param params - The user data to create
 * @returns {Promise<SafeUser>} The created user (without password hash)
 * @throws {APIError} If the user creation fails
 */
export const createUser = api(
  { method: 'POST', path: '/users', expose: true },
  async (params: CreateUserPayload): Promise<SafeUser> => {
    return withErrorHandling('createUser', () => userRepository.create(params));
  },
);

/**
 * Retrieves a user by ID
 * @param params - Object containing the user ID
 * @param params.id - The ID of the user to retrieve
 * @returns {Promise<SafeUser>} The found user (without password hash)
 * @throws {APIError} If the user is not found
 */
export const getUser = api(
  { method: 'GET', path: '/users/:id', expose: true },
  async ({ id }: { id: number }): Promise<SafeUser> => {
    return withErrorHandling('getUser', () => userRepository.findOne(id));
  },
);

/**
 * Retrieves all users
 * @returns {Promise<Users>} List of all users (without password hashes)
 * @throws {APIError} If retrieval fails
 */
export const listUsers = api(
  { method: 'GET', path: '/users', expose: true },
  async (): Promise<Users> => {
    return withErrorHandling('listUsers', async () => {
      const users = await userRepository.findAll();
      return { users };
    });
  },
);

/**
 * Retrieves users with pagination
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedUsers>} Paginated list of users (without password hashes)
 * @throws {APIError} If retrieval fails
 */
export const listUsersWithPagination = api(
  { method: 'GET', path: '/users/paginated', expose: true },
  async (params: PaginationParams): Promise<PaginatedUsers> => {
    return withErrorHandling('listUsersWithPagination', () =>
      userRepository.findAllPaginated(params),
    );
  },
);

/**
 * Retrieves all users for a specific tenant
 * @param params - Object containing the tenant ID
 * @param params.tenantId - The ID of the tenant to get users for
 * @returns {Promise<Users>} List of users for the tenant (without password hashes)
 * @throws {APIError} If retrieval fails
 */
export const listTenantUsers = api(
  { method: 'GET', path: '/tenants/:tenantId/users', expose: true },
  async ({ tenantId }: { tenantId: number }): Promise<Users> => {
    return withErrorHandling('listTenantUsers', () =>
      userRepository.findByTenant(tenantId),
    );
  },
);

/**
 * Retrieves paginated users for a specific tenant
 * @param params - Object containing the tenant ID and pagination parameters
 * @param params.tenantId - The ID of the tenant to get users for
 * @returns {Promise<PaginatedUsers>} Paginated list of users for the tenant (without password hashes)
 * @throws {APIError} If retrieval fails
 */
export const listTenantUsersWithPagination = api(
  {
    method: 'GET',
    path: '/tenants/:tenantId/users/paginated',
    expose: true,
  },
  async ({
    tenantId,
    ...paginationParams
  }: {
    tenantId: number;
  } & PaginationParams): Promise<PaginatedUsers> => {
    return withErrorHandling('listTenantUsersWithPagination', () =>
      userRepository.findByTenantPaginated(tenantId, paginationParams),
    );
  },
);

/**
 * Retrieves all users for a specific department
 * @param params - Object containing the department ID
 * @param params.departmentId - The ID of the department to get users for
 * @returns {Promise<Users>} List of users for the department (without password hashes)
 * @throws {APIError} If retrieval fails
 */
export const listDepartmentUsers = api(
  { method: 'GET', path: '/departments/:departmentId/users', expose: true },
  async ({ departmentId }: { departmentId: number }): Promise<Users> => {
    return withErrorHandling('listDepartmentUsers', () =>
      userRepository.findByDepartment(departmentId),
    );
  },
);

/**
 * Retrieves paginated users for a specific department
 * @param params - Object containing the department ID and pagination parameters
 * @param params.departmentId - The ID of the department to get users for
 * @returns {Promise<PaginatedUsers>} Paginated list of users for the department (without password hashes)
 * @throws {APIError} If retrieval fails
 */
export const listDepartmentUsersWithPagination = api(
  {
    method: 'GET',
    path: '/departments/:departmentId/users/paginated',
    expose: true,
  },
  async ({
    departmentId,
    ...paginationParams
  }: {
    departmentId: number;
  } & PaginationParams): Promise<PaginatedUsers> => {
    return withErrorHandling('listDepartmentUsersWithPagination', () =>
      userRepository.findByDepartmentPaginated(departmentId, paginationParams),
    );
  },
);

/**
 * Updates an existing user
 * @param params - Object containing the user ID and update data
 * @param params.id - The ID of the user to update
 * @returns {Promise<SafeUser>} The updated user (without password hash)
 * @throws {APIError} If the user is not found or update fails
 */
export const updateUser = api(
  { method: 'PUT', path: '/users/:id', expose: true },
  async ({
    id,
    ...data
  }: UpdateUserPayload & { id: number }): Promise<SafeUser> => {
    return withErrorHandling('updateUser', () =>
      userRepository.update(id, data),
    );
  },
);

/**
 * Changes a user's password
 * @param params - Object containing the user ID and password data
 * @param params.id - The ID of the user to update
 * @returns {Promise<SafeUser>} The updated user (without password hash)
 * @throws {APIError} If the user is not found, current password is invalid, or update fails
 */
export const changePassword = api(
  { method: 'PUT', path: '/users/:id/password', expose: true },
  async ({
    id,
    ...data
  }: ChangePasswordPayload & { id: number }): Promise<SafeUser> => {
    return withErrorHandling('changePassword', () => 
      userUseCases.changePassword(id, data)
    );
  },
);

/**
 * Deletes a user by ID
 * @param params - Object containing the user ID
 * @param params.id - The ID of the user to delete
 * @returns {Promise<SafeUser>} The deleted user (without password hash)
 * @throws {APIError} If the user is not found or deletion fails
 */
export const deleteUser = api(
  { method: 'DELETE', path: '/users/:id', expose: true },
  async ({ id }: { id: number }): Promise<SafeUser> => {
    return withErrorHandling('deleteUser', async () => {
      return userRepository.delete(id);
    });
  },
);
