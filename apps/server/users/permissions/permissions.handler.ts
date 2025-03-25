import { db } from '../../db';
import { NotFoundError, DuplicateError } from '../../shared/errors';
import { permissions } from './permissions.schema';
import { eq } from 'drizzle-orm';
import type {
  Permission,
  CreatePermissionPayload,
  UpdatePermissionPayload,
  Permissions,
  PaginatedPermissions,
} from './permissions.types';
import { PaginationParams } from '../../shared/types';
import { BaseHandler } from '../../shared/base-handler';

/**
 * Handler for permission operations
 */
class PermissionHandler extends BaseHandler<
  Permission,
  CreatePermissionPayload,
  UpdatePermissionPayload
> {
  constructor() {
    super(permissions, 'Permission');
  }

  /**
   * Creates a new permission
   * @param data - Permission data to create
   * @returns Created permission
   * @throws {DuplicateError} If a permission with the same code already exists
   */
  async create(data: CreatePermissionPayload): Promise<Permission> {
    try {
      await this.validateUniqueCode(data.code);
      return super.create(data);
    } catch (error) {
      if (error instanceof DuplicateError) {
        throw error;
      }
      console.error('Error creating permission:', error);
      throw error;
    }
  }

  /**
   * Finds a permission by ID
   * @param id - ID of the permission to find
   * @returns Found permission
   * @throws {NotFoundError} If the permission is not found
   */
  async findOne(id: number): Promise<Permission> {
    const [permission] = await db
      .select()
      .from(permissions)
      .where(eq(permissions.id, id))
      .limit(1);

    if (!permission) {
      throw new NotFoundError(`Permission with id ${id} not found`);
    }

    return permission;
  }

  /**
   * Finds a permission by code
   * @param code - Code of the permission to find
   * @returns Found permission
   * @throws {NotFoundError} If the permission is not found
   */
  async findByCode(code: string): Promise<Permission> {
    const permission = await this.findByField(permissions.code, code);

    if (!permission) {
      throw new NotFoundError(`Permission with code ${code} not found`);
    }

    return permission;
  }

  /**
   * Finds all permissions
   * @returns All permissions
   */
  async findAll(): Promise<Permissions> {
    const result = await super.findAll();
    return { permissions: result };
  }

  /**
   * Finds all permissions with pagination
   * @param params - Pagination parameters
   * @returns Paginated permissions
   */
  async findAllPaginated(
    params: PaginationParams,
  ): Promise<PaginatedPermissions> {
    return (await super.findAllPaginated(params)) as PaginatedPermissions;
  }

  /**
   * Updates a permission
   * @param id - ID of the permission to update
   * @param data - Permission data to update
   * @returns Updated permission
   * @throws {NotFoundError} If the permission is not found
   */
  async update(id: number, data: UpdatePermissionPayload): Promise<Permission> {
    await this.findOne(id);

    const [permission] = await db
      .update(permissions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(permissions.id, id))
      .returning();

    return permission;
  }

  /**
   * Deletes a permission
   * @param id - ID of the permission to delete
   * @returns Deleted permission
   * @throws {NotFoundError} If the permission is not found
   */
  async delete(id: number): Promise<Permission> {
    await this.findOne(id);

    const [permission] = await db
      .delete(permissions)
      .where(eq(permissions.id, id))
      .returning();

    return permission;
  }

  /**
   * Validates that a permission code is unique
   * @param code - Code to validate
   * @throws {DuplicateError} If a permission with the same code already exists
   */
  private async validateUniqueCode(code: string): Promise<void> {
    try {
      const exists = await this.existsByField(permissions.code, code);
      if (exists) {
        throw new DuplicateError(`Permission with code ${code} already exists`);
      }
    } catch (error) {
      if (error instanceof DuplicateError) {
        throw error;
      }
      // If there's an error checking for uniqueness, log it and rethrow as a more specific error
      console.error('Error checking permission code uniqueness:', error);
      throw new Error(`Failed to validate permission code uniqueness: ${(error as Error).message}`);
    }
  }
}

export const permissionHandler = new PermissionHandler();
