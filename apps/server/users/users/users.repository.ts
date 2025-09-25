import { secret } from 'encore.dev/config';
import { createBaseRepository } from '@repo/base-repo';
import { hashPassword, omitPasswordHash } from '@/shared/auth-utils';
import { db } from '../db-service';
import { users } from './users.schema';
import type {
  CreateUserPayload,
  ListUsersQueryParams,
  PaginatedListUsersQueryParams,
  PaginatedListUsersResult,
  SafeUser,
  UpdateUserPayload,
  User,
} from './users.types';

// Get salt rounds from Encore secret
const SALT_ROUNDS = parseInt(secret('SALT_ROUNDS')());

/**
 * Creates a repository for managing user entities
 * @returns {Object} An object containing user-specific operations and base CRUD operations
 */
export function createUserRepository() {
  const baseRepository = createBaseRepository<
    User,
    CreateUserPayload & {
      passwordHash: string;
      active?: boolean;
      isSystemAdmin: boolean;
    },
    UpdateUserPayload,
    typeof users
  >(db, users, 'User', {
    searchableFields: [
      users.firstName,
      users.lastName,
      users.email,
      users.username,
      users.employeeId,
    ],
  });

  /**
   * Creates a new user
   * @param data User creation payload
   * @returns Created user (without password hash)
   */
  async function create(data: CreateUserPayload): Promise<SafeUser> {
    const user = await baseRepository.create({
      ...data,
      passwordHash: await hashPassword(data.password, SALT_ROUNDS),
      isSystemAdmin: true, // TODO: Remove this once we have a proper role system
      active: data.active ?? true,
    });

    return await Promise.resolve(omitPasswordHash(user));
  }

  /**
   * Updates an existing user
   * @param id User ID
   * @param data User update payload
   * @returns Updated user (without password hash)
   */
  async function update(
    id: number,
    data: UpdateUserPayload,
  ): Promise<SafeUser> {
    const user = await baseRepository.update(id, data);
    return await Promise.resolve(omitPasswordHash(user));
  }

  /**
   * Finds a user by ID
   * @param id User ID
   * @returns User (without password hash)
   */
  async function findOne(id: number): Promise<SafeUser> {
    const user = await baseRepository.findOne(id);
    return await Promise.resolve(omitPasswordHash(user));
  }

  /**
   * Finds all users with optional filtering and ordering
   * @param options Query options for filtering and ordering
   * @returns Array of users (without password hashes)
   */
  async function findAll(
    options: ListUsersQueryParams = {},
  ): Promise<SafeUser[]> {
    const allUsers = await baseRepository.findAll(options);
    return await Promise.resolve(allUsers.map(omitPasswordHash));
  }

  /**
   * Finds all users with pagination, filtering, and ordering
   * @param params Pagination, filtering, and ordering parameters
   * @returns Paginated result of users (without password hashes)
   */
  async function findAllPaginated(
    params: PaginatedListUsersQueryParams = {},
  ): Promise<PaginatedListUsersResult> {
    const { data, pagination } = await baseRepository.findAllPaginated(params);
    return await Promise.resolve({
      data: data.map(omitPasswordHash),
      pagination,
    });
  }

  /**
   * Finds a user by username (including password hash)
   * @param username Username
   * @returns User with password hash or null if not found
   */
  async function findByUsername(username: string): Promise<User | null> {
    return await baseRepository.findBy(users.username, username);
  }

  /**
   * Finds a user by email (including password hash)
   * @param email Email address
   * @returns User with password hash or null if not found
   */
  async function findByEmail(email: string): Promise<User | null> {
    return await baseRepository.findBy(users.email, email);
  }

  /**
   * Finds a user by ID (including password hash)
   * @param id User ID
   * @returns User with password hash
   */
  async function findOneWithPassword(id: number): Promise<User> {
    return await baseRepository.findOne(id);
  }

  /**
   * Deletes a user
   * @param id User ID
   * @returns Deleted user (without password hash)
   */
  async function delete_(id: number): Promise<SafeUser> {
    const user = await baseRepository.delete(id);
    return await Promise.resolve(omitPasswordHash(user));
  }

  return {
    ...baseRepository,
    create,
    update,
    findOne,
    findAll,
    findAllPaginated,
    findByUsername,
    findByEmail,
    findOneWithPassword,
    delete: delete_,
  };
}

// Export the user repository instance
export const userRepository = createUserRepository();
