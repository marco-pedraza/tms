import { api } from 'encore.dev/api';
import type {
  ChangePasswordPayload,
  CreateUserPayload,
  ListUsersQueryParams,
  ListUsersResult,
  PaginatedListUsersQueryParams,
  PaginatedListUsersResult,
  SafeUser,
  UpdateUserPayload,
  UserWithDepartment,
} from './users.types';
import { userRepository } from './users.repository';
import { validatePasswordChange, validateUser } from './users.domain';
import { userUseCases } from './users.use-cases';

/**
 * Creates a new user.
 * @param params - The user data to create
 * @returns {Promise<SafeUser>} The created user (without password hash)
 * @throws {APIError} If the user creation fails
 */
export const createUser = api(
  { expose: true, method: 'POST', path: '/users/create', auth: false },
  async (params: CreateUserPayload): Promise<SafeUser> => {
    await validateUser(params);
    return await userRepository.create(params);
  },
);

/**
 * Updates an existing user.
 * @param params - Object containing the user ID and update data
 * @param params.id - The ID of the user to update
 * @returns {Promise<SafeUser>} The updated user (without password hash)
 * @throws {APIError} If the user is not found or update fails
 */
export const updateUser = api(
  { expose: true, method: 'PUT', path: '/users/:id/update', auth: false },
  async ({
    id,
    ...data
  }: UpdateUserPayload & { id: number }): Promise<SafeUser> => {
    await validateUser(data, id);
    return await userRepository.update(id, data);
  },
);

/**
 * Deletes a user by its ID.
 * @param params - Object containing the user ID
 * @param params.id - The ID of the user to delete
 * @returns {Promise<SafeUser>} The deleted user (without password hash)
 * @throws {APIError} If the user is not found or deletion fails
 */
export const deleteUser = api(
  { expose: true, method: 'DELETE', path: '/users/:id/delete', auth: false },
  async ({ id }: { id: number }): Promise<SafeUser> => {
    return await userRepository.delete(id);
  },
);

/**
 * Retrieves a user by its ID.
 * @param params - Object containing the user ID
 * @param params.id - The ID of the user to retrieve
 * @returns {Promise<UserWithDepartment>} The found user with department information
 * @throws {APIError} If the user is not found or retrieval fails
 */
export const getUser = api(
  { expose: true, method: 'GET', path: '/users/:id', auth: false },
  async ({ id }: { id: number }): Promise<UserWithDepartment> => {
    return await userRepository.findOne(id);
  },
);

/**
 * Retrieves all users without pagination (useful for dropdowns).
 * @param params - Query parameters including orderBy, filters, and searchTerm
 * @returns {Promise<ListUsersResult>} Unified response with data property containing array of users
 * @throws {APIError} If retrieval fails
 */
export const listUsers = api(
  { expose: true, method: 'POST', path: '/users/list/all', auth: false },
  async (params: ListUsersQueryParams): Promise<ListUsersResult> => {
    const users = await userRepository.findAll(params);
    return {
      data: users,
    };
  },
);

/**
 * Retrieves users with pagination (useful for tables).
 * @param params - Pagination and query parameters including page, pageSize, orderBy, filters, and searchTerm
 * @returns {Promise<PaginatedListUsersResult>} Unified paginated response with data and pagination properties
 * @throws {APIError} If retrieval fails
 */
export const listUsersPaginated = api(
  { expose: true, method: 'POST', path: '/users/list', auth: false },
  async (
    params: PaginatedListUsersQueryParams,
  ): Promise<PaginatedListUsersResult> => {
    const usersResult = await userRepository.findAllPaginated(params);

    return await userRepository.appendRelations(
      usersResult.data,
      usersResult.pagination,
      params,
    );
  },
);

/**
 * Changes a user's password.
 * @param params - Object containing the user ID and password data
 * @param params.id - The ID of the user to update
 * @returns {Promise<SafeUser>} The updated user (without password hash)
 * @throws {APIError} If the user is not found, current password is invalid, or update fails
 */
export const changePassword = api(
  { expose: true, method: 'PUT', path: '/users/:id/password', auth: false },
  async ({
    id,
    ...data
  }: ChangePasswordPayload & { id: number }): Promise<SafeUser> => {
    await validatePasswordChange(id, data);
    return await userUseCases.changePassword(id, data);
  },
);
