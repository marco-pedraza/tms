import { api } from 'encore.dev/api';
import type {
  ChangePasswordPayload,
  CreateUserPayload,
  PaginatedUsers,
  PaginationParamsUsers,
  SafeUser,
  UpdateUserPayload,
  Users,
  UsersQueryOptions,
} from './users.types';
import { userRepository } from './users.repository';
import { userUseCases } from './users.use-cases';

/**
 * Creates a new user
 * @param params - The user data to create
 * @returns {Promise<SafeUser>} The created user (without password hash)
 * @throws {APIError} If the user creation fails
 */
export const createUser = api(
  { method: 'POST', path: '/users', expose: true, auth: true },
  async (params: CreateUserPayload): Promise<SafeUser> => {
    return await userRepository.create(params);
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
  { method: 'GET', path: '/users/:id', expose: true, auth: true },
  async ({ id }: { id: number }): Promise<SafeUser> => {
    return await userRepository.findOne(id);
  },
);

/**
 * Retrieves all users with optional filtering and ordering (useful for dropdowns)
 * @param params - Query options for filtering and ordering
 * @returns {Promise<Users>} List of all users (without password hashes)
 * @throws {APIError} If retrieval fails
 */
export const listUsers = api(
  { method: 'POST', path: '/get-users', expose: true, auth: true },
  async (params: UsersQueryOptions): Promise<Users> => {
    const users = await userRepository.findAll(params);
    return { users };
  },
);

/**
 * Retrieves users with pagination, filtering, and ordering (useful for tables)
 * @param params - Pagination, filtering, and ordering parameters
 * @returns {Promise<PaginatedUsers>} Paginated list of users (without password hashes)
 * @throws {APIError} If retrieval fails
 */
export const listUsersPaginated = api(
  { method: 'POST', path: '/get-users/paginated', expose: true, auth: true },
  async (params: PaginationParamsUsers): Promise<PaginatedUsers> => {
    return await userRepository.findAllPaginated(params);
  },
);

/**
 * Retrieves users for a specific department with optional filtering and ordering
 * @param params - Object containing the department ID and query options
 * @param params.departmentId - The ID of the department to get users for
 * @returns {Promise<Users>} List of users for the department (without password hashes)
 * @throws {APIError} If retrieval fails
 */
export const listDepartmentUsers = api(
  {
    method: 'POST',
    path: '/departments/:departmentId/users',
    expose: true,
    auth: true,
  },
  async ({
    departmentId,
    ...options
  }: { departmentId: number } & UsersQueryOptions): Promise<Users> => {
    const users = await userRepository.findByDepartment(departmentId, options);
    return { users };
  },
);

/**
 * Retrieves paginated users for a specific department with filtering and ordering
 * @param params - Object containing the department ID and pagination/query parameters
 * @param params.departmentId - The ID of the department to get users for
 * @returns {Promise<PaginatedUsers>} Paginated list of users for the department
 * @throws {APIError} If retrieval fails
 */
export const listDepartmentUsersPaginated = api(
  {
    method: 'POST',
    path: '/departments/:departmentId/users/paginated',
    expose: true,
    auth: true,
  },
  async ({
    departmentId,
    ...params
  }: {
    departmentId: number;
  } & PaginationParamsUsers): Promise<PaginatedUsers> => {
    return await userRepository.findByDepartmentPaginated(departmentId, params);
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
  { method: 'PUT', path: '/users/:id', expose: true, auth: true },
  async ({
    id,
    ...data
  }: UpdateUserPayload & { id: number }): Promise<SafeUser> => {
    return await userRepository.update(id, data);
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
  { method: 'PUT', path: '/users/:id/password', expose: true, auth: true },
  async ({
    id,
    ...data
  }: ChangePasswordPayload & { id: number }): Promise<SafeUser> => {
    return await userUseCases.changePassword(id, data);
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
  { method: 'DELETE', path: '/users/:id', expose: true, auth: true },
  async ({ id }: { id: number }): Promise<SafeUser> => {
    return await userRepository.delete(id);
  },
);

/**
 * Searches for users by matching a search term against name, email, and username
 * @param params - Search parameters
 * @param params.term - The search term to match against user fields
 * @returns {Promise<Users>} List of matching users (without password hashes)
 * @throws {APIError} If search fails or no searchable fields are configured
 */
export const searchUsers = api(
  { method: 'GET', path: '/users/search', expose: true, auth: true },
  async ({ term }: { term: string }): Promise<Users> => {
    const users = await userRepository.search(term);
    return { users };
  },
);

/**
 * Searches for users with pagination by matching a search term against name, email, and username
 * @param params - Search and pagination parameters
 * @param params.term - The search term to match against user fields
 * @returns {Promise<PaginatedUsers>} Paginated list of matching users (without password hashes)
 * @throws {APIError} If search fails or no searchable fields are configured
 */
export const searchUsersPaginated = api(
  { method: 'POST', path: '/users/search/paginated', expose: true, auth: true },
  async ({
    term,
    ...params
  }: PaginationParamsUsers & {
    term: string;
  }): Promise<PaginatedUsers> => {
    return await userRepository.searchPaginated(term, params);
  },
);
