import { db } from '@/db';
import { users } from './users.schema';
import { eq, and, or, not, asc, count } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import type {
  User,
  SafeUser,
  Users,
  PaginatedUsers,
  CreateUserPayload,
  UpdateUserPayload,
  ChangePasswordPayload,
} from './users.types';
import {
  NotFoundError,
  ValidationError,
  DuplicateError,
  AuthenticationError,
} from '../../shared/errors';
import { PaginationParams } from '../../shared/types';
import { withPagination } from '../../shared/db-utils';
import { BaseHandler } from '../../shared/base-handler';

export class UserHandler extends BaseHandler<
  User,
  CreateUserPayload,
  UpdateUserPayload
> {
  /**
   * The number of salt rounds for bcrypt hashing
   * @private
   */
  private readonly SALT_ROUNDS = 10;

  constructor() {
    super(users, 'User');
  }

  /**
   * Hashes a password using bcrypt
   * @param password - The plain text password to hash
   * @returns The hashed password
   * @private
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compares a plain text password with a hashed password
   * @param plainTextPassword - The plain text password to check
   * @param hashedPassword - The hashed password to compare against
   * @returns True if the passwords match, false otherwise
   * @private
   */
  private async comparePassword(
    plainTextPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, hashedPassword);
  }

  /**
   * Validates that the username and email are unique
   * @param username - The username to check
   * @param email - The email to check
   * @param excludeId - Optional ID to exclude from the check (for updates)
   * @throws {DuplicateError} If the username or email already exists
   * @private
   */
  private async validateUniqueUserIdentifiers(
    username?: string,
    email?: string,
    excludeId?: number,
  ): Promise<void> {
    if (!username && !email) return;

    const conditions = [];
    if (username) {
      conditions.push(eq(users.username, username));
    }
    if (email) {
      conditions.push(eq(users.email, email));
    }

    const whereCondition = excludeId
      ? and(or(...conditions), not(eq(users.id, excludeId)))
      : or(...conditions);

    const [existing] = await db
      .select()
      .from(users)
      .where(whereCondition)
      .limit(1);

    if (existing) {
      if (existing.username === username) {
        throw new DuplicateError('A user with this username already exists');
      }
      if (existing.email === email) {
        throw new DuplicateError('A user with this email already exists');
      }
    }
  }

  /**
   * Removes sensitive information from user object
   * @param user - The full user object
   * @returns User object without sensitive fields
   * @private
   */
  private sanitizeUser(user: User): SafeUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Creates a new user
   * @param data - The user data to create
   * @returns The created user (without sensitive data)
   * @throws {ValidationError|DuplicateError} If validation fails or duplicate is found
   */
  async create(data: CreateUserPayload): Promise<SafeUser> {
    try {
      // Validate unique username and email
      await this.validateUniqueUserIdentifiers(data.username, data.email);

      // Hash the password
      const passwordHash = await this.hashPassword(data.password);

      const userData = {
        tenantId: data.tenantId,
        departmentId: data.departmentId,
        username: data.username,
        email: data.email,
        passwordHash: passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        position: data.position || null,
        employeeId: data.employeeId || null,
        mfaSettings: null,
        lastLogin: null,
        isActive: data.isActive ?? true,
        isSystemAdmin: data.isSystemAdmin ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const user = await super.create(userData);
      return this.sanitizeUser(user);
    } catch (error) {
      if (error instanceof DuplicateError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new ValidationError(error.message);
      }
      throw error;
    }
  }

  /**
   * Finds a user by ID
   * @param id - The user ID to find
   * @returns The found user (without sensitive data)
   * @throws {NotFoundError} If user is not found
   */
  async findOne(id: number): Promise<SafeUser> {
    const user = await super.findOne(id);
    return this.sanitizeUser(user);
  }

  /**
   * Updates a user
   * @param id - The user ID to update
   * @param data - The user data to update
   * @returns The updated user (without sensitive data)
   * @throws {NotFoundError|ValidationError|DuplicateError} If user not found, validation fails, or duplicate found
   */
  async update(id: number, data: UpdateUserPayload): Promise<SafeUser> {
    try {
      // Verify user exists
      await this.findOne(id);

      // Check for duplicate email if being updated
      if (data.email) {
        await this.validateUniqueUserIdentifiers(undefined, data.email, id);
      }

      const updatedUser = await super.update(id, data);
      return this.sanitizeUser(updatedUser);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DuplicateError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new ValidationError(error.message);
      }
      throw error;
    }
  }

  /**
   * Changes a user's password
   * @param id - The user ID
   * @param data - Object containing current and new password
   * @returns The updated user (without sensitive data)
   * @throws {NotFoundError|AuthenticationError} If user not found or current password is incorrect
   */
  async changePassword(
    id: number,
    data: ChangePasswordPayload,
  ): Promise<SafeUser> {
    try {
      // Get full user (with password) for verification
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const passwordMatches = await this.comparePassword(
        data.currentPassword,
        user.passwordHash,
      );

      if (!passwordMatches) {
        throw new AuthenticationError('Current password is incorrect');
      }

      // Hash and set new password
      const passwordHash = await this.hashPassword(data.newPassword);
      const [updated] = await db
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();

      return this.sanitizeUser(updated);
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof DuplicateError ||
        error instanceof AuthenticationError
      ) {
        throw error;
      }
      if (error instanceof Error) {
        throw new ValidationError(error.message);
      }
      throw error;
    }
  }

  /**
   * Deletes a user
   * @param id - The user ID to delete
   * @returns The deleted user (without sensitive data)
   * @throws {NotFoundError} If user not found
   */
  async delete(id: number): Promise<SafeUser> {
    const deletedUser = await super.delete(id);
    return this.sanitizeUser(deletedUser);
  }

  /**
   * Finds all users
   * @returns An object containing an array of all users (without sensitive data)
   */
  async findAll(): Promise<Users> {
    const userList = await super.findAll();
    return {
      users: userList.map((user) => this.sanitizeUser(user)),
    };
  }

  /**
   * Finds all users for a specific tenant
   * @param tenantId - The tenant ID to filter by
   * @returns List of users for the tenant (without sensitive data)
   */
  async findByTenant(tenantId: number): Promise<Users> {
    const userList = await db
      .select()
      .from(users)
      .where(eq(users.tenantId, tenantId));

    return {
      users: userList.map((user) => this.sanitizeUser(user)),
    };
  }

  /**
   * Finds all users with pagination
   * @param params Pagination parameters
   * @returns Paginated users with metadata
   */
  async findAllPaginated(
    params: PaginationParams = {},
  ): Promise<PaginatedUsers> {
    return this.getPaginatedUsers({ params });
  }

  /**
   * Finds all users for a specific tenant with pagination
   * @param tenantId - The tenant ID to filter by
   * @param params - Pagination parameters
   * @returns Paginated users with metadata
   */
  async findByTenantPaginated(
    tenantId: number,
    params: PaginationParams = {},
  ): Promise<PaginatedUsers> {
    return this.getPaginatedUsers({ tenantId, params });
  }

  /**
   * Builds and executes paginated user queries
   * @param options - Options for pagination query
   * @param options.tenantId - Optional tenant ID to filter by
   * @param options.params - Pagination parameters
   * @returns Paginated users with metadata
   * @private
   */
  private async getPaginatedUsers({
    tenantId,
    params = {},
  }: {
    tenantId?: number;
    params?: PaginationParams;
  }): Promise<PaginatedUsers> {
    // Create base query with sorting
    const query = db
      .select()
      .from(users)
      .orderBy(asc(users.lastName), asc(users.firstName))
      .$dynamic();

    // Add tenant filter if provided
    if (tenantId !== undefined) {
      query.where(eq(users.tenantId, tenantId));
    }

    // Pagination needs a count query
    const countQuery = db.select({ count: count() }).from(users);

    // Add tenant filter to count query if provided
    if (tenantId !== undefined) {
      countQuery.where(eq(users.tenantId, tenantId));
    }

    // Get paginated results
    const result = await withPagination<typeof query, User>(
      query,
      countQuery,
      params,
    );

    // Sanitize users in the result
    return {
      data: result.data.map((user) => this.sanitizeUser(user)),
      pagination: result.pagination,
    };
  }
}

export const userHandler = new UserHandler();
