import { secret } from 'encore.dev/config';
import { createBaseRepository } from '@repo/base-repo';
import { hashPassword, omitPasswordHash } from '@/shared/auth-utils';
import { db } from '../db-service';
import { users } from './users.schema';
import type {
  CreateUserPayload,
  PaginatedUsers,
  PaginationParamsUsers,
  SafeUser,
  UpdateUserPayload,
  User,
  UsersQueryOptions,
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
      isActive?: boolean;
      isSystemAdmin: boolean;
    },
    UpdateUserPayload & { updatedAt: Date },
    typeof users
  >(db, users, 'User', {
    searchableFields: [
      users.firstName,
      users.lastName,
      users.email,
      users.username,
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
      isSystemAdmin: data.isSystemAdmin ?? false,
      isActive: data.isActive ?? true,
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
    const user = await baseRepository.update(id, {
      ...data,
      updatedAt: new Date(),
    });

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
  async function findAll(options: UsersQueryOptions = {}): Promise<SafeUser[]> {
    const allUsers = await baseRepository.findAll(options);
    return await Promise.resolve(allUsers.map(omitPasswordHash));
  }

  /**
   * Finds all users with pagination, filtering, and ordering
   * @param params Pagination, filtering, and ordering parameters
   * @returns Paginated result of users (without password hashes)
   */
  async function findAllPaginated(
    params: PaginationParamsUsers = {},
  ): Promise<PaginatedUsers> {
    const { data, pagination } = await baseRepository.findAllPaginated(params);
    return await Promise.resolve({
      data: data.map(omitPasswordHash),
      pagination,
    });
  }

  /**
   * Finds users by tenant ID
   * @param tenantId Tenant ID
   * @param options Query options for filtering and ordering
   * @returns Array of users (without password hashes)
   */
  async function findByTenant(
    tenantId: number,
    options: UsersQueryOptions = {},
  ): Promise<SafeUser[]> {
    const mergedOptions: UsersQueryOptions = {
      ...options,
      filters: {
        ...(options.filters ?? {}),
        tenantId,
      },
    };
    const users = await findAll(mergedOptions);
    return users;
  }

  /**
   * Finds users by tenant ID with pagination
   * @param tenantId Tenant ID
   * @param params Pagination, filtering, and ordering parameters
   * @returns Paginated result of users (without password hashes)
   */
  async function findByTenantPaginated(
    tenantId: number,
    params: PaginationParamsUsers = {},
  ): Promise<PaginatedUsers> {
    const mergedParams: PaginationParamsUsers = {
      ...params,
      filters: {
        ...(params.filters ?? {}),
        tenantId,
      },
    };
    return await findAllPaginated(mergedParams);
  }

  /**
   * Finds users by department ID
   * @param departmentId Department ID
   * @param options Query options for filtering and ordering
   * @returns Array of users (without password hashes)
   */
  async function findByDepartment(
    departmentId: number,
    options: UsersQueryOptions = {},
  ): Promise<SafeUser[]> {
    const mergedOptions: UsersQueryOptions = {
      ...options,
      filters: {
        ...(options.filters ?? {}),
        departmentId,
      },
    };
    const users = await findAll(mergedOptions);
    return users;
  }

  /**
   * Finds users by department ID with pagination
   * @param departmentId Department ID
   * @param params Pagination, filtering, and ordering parameters
   * @returns Paginated result of users (without password hashes)
   */
  async function findByDepartmentPaginated(
    departmentId: number,
    params: PaginationParamsUsers = {},
  ): Promise<PaginatedUsers> {
    const mergedParams: PaginationParamsUsers = {
      ...params,
      filters: {
        ...(params.filters ?? {}),
        departmentId,
      },
    };
    return await findAllPaginated(mergedParams);
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
   * Searches for users by term
   * @param term Search term
   * @returns Array of matching users (without password hashes)
   */
  async function search(term: string): Promise<SafeUser[]> {
    const users = await baseRepository.search(term);
    return await Promise.resolve(users.map(omitPasswordHash));
  }

  /**
   * Searches for users by term with pagination
   * @param term Search term
   * @param params Pagination, filtering, and ordering parameters
   * @returns Paginated result of matching users (without password hashes)
   */
  async function searchPaginated(
    term: string,
    params: PaginationParamsUsers = {},
  ): Promise<PaginatedUsers> {
    const { data, pagination } = await baseRepository.searchPaginated(
      term,
      params,
    );
    return await Promise.resolve({
      data: data.map(omitPasswordHash),
      pagination,
    });
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
    findByTenant,
    findByTenantPaginated,
    findByDepartment,
    findByDepartmentPaginated,
    findByUsername,
    findByEmail,
    findOneWithPassword,
    search,
    searchPaginated,
    delete: delete_,
  };
}

// Export the user repository instance
export const userRepository = createUserRepository();
