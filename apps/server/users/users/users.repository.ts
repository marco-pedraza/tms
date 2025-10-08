import { secret } from 'encore.dev/config';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { NotFoundError, createBaseRepository } from '@repo/base-repo';
import { hashPassword, omitPasswordHash } from '@/shared/auth-utils';
import { PaginationMeta } from '@/shared/types';
import { db } from '../db-service';
import type { Role } from '../roles/roles.types';
import { userRoles } from '../user-permissions/user-permissions.schema';
import { users } from './users.schema';
import type {
  CreateUserPayload,
  ListUsersQueryParams,
  PaginatedListUsersQueryParams,
  PaginatedListUsersResult,
  SafeUser,
  SafeUserWithoutRoles,
  UpdateUserPayload,
  User,
  UserWithDepartment,
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
    softDeleteEnabled: true,
  });

  /**
   * Creates a new user
   * @param data User creation payload
   * @returns Created user (without password hash)
   */
  async function create(data: CreateUserPayload): Promise<SafeUser> {
    const { roleIds, ...userData } = data;

    return await baseRepository
      .transaction(async (txRepo, tx) => {
        const user = await txRepo.create({
          ...userData,
          passwordHash: await hashPassword(data.password, SALT_ROUNDS),
          isSystemAdmin: false,
          active: data.active ?? true,
        });

        // Assign roles if provided
        if (roleIds && roleIds.length > 0) {
          await tx.insert(userRoles).values(
            roleIds.map((roleId) => ({
              userId: user.id,
              roleId,
            })),
          );
        }

        const safeUser = omitPasswordHash(user);
        return safeUser;
      })
      .then(async (safeUser) => {
        // Fetch user with roles after transaction completes
        const userWithRoles = await db.query.users.findFirst({
          where: eq(users.id, safeUser.id),
          with: {
            userRoles: {
              with: {
                role: true,
              },
            },
          },
        });

        return {
          ...safeUser,
          roles:
            userWithRoles?.userRoles.map((ur: { role: Role }) => ur.role) || [],
        };
      });
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
    const { roleIds, ...userData } = data;

    return await baseRepository
      .transaction(async (txRepo, tx) => {
        // Update user data
        const user = await txRepo.update(id, userData);

        // Update roles if provided
        if (roleIds !== undefined) {
          // Get current role assignments
          const currentRoles = await tx
            .select()
            .from(userRoles)
            .where(eq(userRoles.userId, id));

          const currentRoleIds = currentRoles.map((r) => r.roleId);

          // Calculate roles to add and remove
          const rolesToAdd = roleIds.filter(
            (roleId) => !currentRoleIds.includes(roleId),
          );
          const rolesToRemove = currentRoleIds.filter(
            (roleId) => !roleIds.includes(roleId),
          );

          // Remove roles that are no longer assigned (bulk operation)
          if (rolesToRemove.length > 0) {
            await tx
              .delete(userRoles)
              .where(
                and(
                  eq(userRoles.userId, id),
                  inArray(userRoles.roleId, rolesToRemove),
                ),
              );
          }

          // Add new role assignments (bulk operation)
          if (rolesToAdd.length > 0) {
            await tx.insert(userRoles).values(
              rolesToAdd.map((roleId) => ({
                userId: id,
                roleId,
              })),
            );
          }
        }

        const safeUser = omitPasswordHash(user);
        return safeUser;
      })
      .then(async (safeUser) => {
        // Fetch user with roles after transaction completes
        const userWithRoles = await db.query.users.findFirst({
          where: eq(users.id, safeUser.id),
          with: {
            userRoles: {
              with: {
                role: true,
              },
            },
          },
        });

        const { userRoles } = userWithRoles || {};
        return {
          ...safeUser,
          roles: userRoles?.map((ur: { role: Role }) => ur.role) || [],
        };
      });
  }

  /**
   * Finds a user by ID including department and roles information
   * @param id User ID
   * @returns User with department and roles information (without password hash)
   */
  async function findOne(id: number): Promise<UserWithDepartment> {
    const result = await db.query.users.findFirst({
      where: and(eq(users.id, id), isNull(users.deletedAt)),
      with: {
        department: true,
        userRoles: {
          with: {
            role: true,
          },
        },
      },
    });

    if (!result) {
      throw new NotFoundError(`User with id ${id} not found`);
    }

    const {
      department,
      userRoles: userRolesData,
      ...userWithoutDepartment
    } = result;
    const safeUser = omitPasswordHash(userWithoutDepartment as User);
    return {
      ...safeUser,
      department,
      roles: userRolesData.map((ur) => ur.role),
    };
  }

  /**
   * Appends relations (roles) to users
   *
   * This function takes a list of users and enriches them with related roles information.
   * It's designed to be used after getting paginated results from the base repository.
   *
   * @param usersResult - Array of users to append relations to
   * @param pagination - Pagination metadata
   * @param params - Query parameters for ordering
   * @returns Users with relations and pagination metadata
   */
  async function appendRelations(
    usersResult: SafeUserWithoutRoles[],
    pagination: PaginationMeta,
    params: ListUsersQueryParams,
  ): Promise<PaginatedListUsersResult> {
    // Return early if no users to process
    if (usersResult.length === 0) {
      return { data: [], pagination };
    }

    const { baseOrderBy } = baseRepository.buildQueryExpressions(params);
    const ids = usersResult.map((user) => user.id);

    const usersWithRelations = await db.query.users.findMany({
      where: inArray(users.id, ids),
      orderBy: baseOrderBy,
      with: {
        userRoles: {
          with: {
            role: true,
          },
        },
      },
    });

    // Transform the users to include their roles and remove password hash
    const usersWithRoles: SafeUser[] = usersWithRelations.map((user) => {
      const { userRoles, ...userWithoutRoles } = user;
      return {
        ...omitPasswordHash(userWithoutRoles as User),
        roles: userRoles.map((ur) => ur.role),
      };
    });

    return {
      data: usersWithRoles,
      pagination,
    };
  }

  /**
   * Finds all users with optional filtering and ordering
   * @param options Query options for filtering and ordering
   * @returns Array of users (without password hashes)
   */
  async function findAll(
    options: ListUsersQueryParams = {},
  ): Promise<SafeUserWithoutRoles[]> {
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
    appendRelations,
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
