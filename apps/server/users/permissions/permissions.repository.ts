import { permissions } from './permissions.schema';
import type {
  Permission,
  CreatePermissionPayload,
  UpdatePermissionPayload,
  Permissions,
  PaginatedPermissions,
} from './permissions.types';
import { createBaseRepository } from '@repo/base-repo';
import { PaginationParams } from '../../shared/types';
import { errors } from '../../shared/errors';
import { db } from '@/db';

/**
 * Creates a repository for managing permission entities
 * @returns {Object} An object containing permission-specific operations and base CRUD operations
 */
export const createPermissionRepository = () => {
  const baseRepository = createBaseRepository<
    Permission,
    CreatePermissionPayload,
    UpdatePermissionPayload,
    typeof permissions
  >(db, permissions, 'Permission');

  /**
   * Creates a new permission
   * @param data - The permission data to create
   * @returns The created permission
   */
  const create = async (data: CreatePermissionPayload): Promise<Permission> => {
    return await baseRepository.create(data);
  };

  /**
   * Finds a permission by code
   * @param code - The code of the permission to find
   * @returns The found permission
   * @throws {APIError} If the permission is not found
   */
  const findByCode = async (code: string): Promise<Permission> => {
    const permission = await baseRepository.findBy(permissions.code, code);

    if (!permission) {
      throw errors.notFound(`Permission with code ${code} not found`);
    }

    return permission;
  };

  /**
   * Finds all permissions
   * @returns List of all permissions
   */
  const findAll = async (): Promise<Permissions> => {
    const allPermissions = await baseRepository.findAll();
    return { permissions: allPermissions };
  };

  /**
   * Lists permissions with pagination
   * @param params - Pagination parameters
   * @returns Paginated list of permissions
   */
  const findAllPaginated = async (
    params: PaginationParams = {},
  ): Promise<PaginatedPermissions> => {
    return await baseRepository.findAllPaginated(params);
  };

  return {
    ...baseRepository,
    create,
    findByCode,
    findAll,
    findAllPaginated,
  };
};

// Export the permission repository instance
export const permissionRepository = createPermissionRepository();
