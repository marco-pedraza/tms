import { permissions } from './permissions.schema';
import type {
  Permission,
  CreatePermissionPayload,
  UpdatePermissionPayload,
  Permissions,
  PaginatedPermissions,
} from './permissions.types';
import { createBaseRepository } from '../../shared/base-repository';
import { PaginationParams } from '../../shared/types';
import { DuplicateError } from '../../shared/errors';

const DEFAULT_ERROR_MESSAGE = 'Permission with this code already exists';

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
  >(permissions, 'Permission');

  /**
   * Validates that a permission code is unique
   * @param code - The code to validate
   * @throws {DuplicateError} If a permission with the same code already exists
   */
  const validateUniqueCode = async (code: string): Promise<void> => {
    try {
      await baseRepository.validateUniqueness(
        [{ field: permissions.code, value: code }],
        undefined,
        DEFAULT_ERROR_MESSAGE,
      );
    } catch (error) {
      throw error;
    }
  };

  /**
   * Creates a new permission with code validation
   * @param data - The permission data to create
   * @returns The created permission
   */
  const create = async (data: CreatePermissionPayload): Promise<Permission> => {
    await validateUniqueCode(data.code);
    return baseRepository.create(data);
  };

  /**
   * Finds a permission by code
   * @param code - The code of the permission to find
   * @returns The found permission
   */
  const findByCode = async (code: string): Promise<Permission> => {
    const permission = await baseRepository.findBy(permissions.code, code);
    
    if (!permission) {
      throw new Error(`Permission with code ${code} not found`);
    }
    
    return permission;
  };

  /**
   * Finds all permissions
   * @returns List of all permissions
   */
  const findAll = async (): Promise<Permissions> => {
    const result = await baseRepository.findAll();
    return { permissions: result };
  };

  /**
   * Lists permissions with pagination
   * @param params - Pagination parameters
   * @returns Paginated list of permissions
   */
  const findAllPaginated = async (
    params: PaginationParams = {},
  ): Promise<PaginatedPermissions> => {
    return baseRepository.findAllPaginated(params) as Promise<PaginatedPermissions>;
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