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
import { NotFoundError } from '../../shared/errors';

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
   * Creates a new permission with code validation
   * @param data - The permission data to create
   * @returns The created permission
   */
  const create = async (data: CreatePermissionPayload): Promise<Permission> => {
    await baseRepository.validateUniqueness(
      [{ field: permissions.code, value: data.code }],
      undefined,
      DEFAULT_ERROR_MESSAGE,
    );
    return baseRepository.create(data);
  };

  /**
   * Finds a permission by code
   * @param code - The code of the permission to find
   * @returns The found permission
   * @throws {NotFoundError} If the permission is not found
   */
  const findByCode = async (code: string): Promise<Permission> => {
    const permission = await baseRepository.findBy(permissions.code, code);

    if (!permission) {
      throw new NotFoundError(`Permission with code ${code} not found`);
    }

    return permission;
  };

  /**
   * Finds all permissions
   * @returns List of all permissions
   */
  const findAll = async (): Promise<Permissions> => {
    return { permissions: await baseRepository.findAll() };
  };

  /**
   * Lists permissions with pagination
   * @param params - Pagination parameters
   * @returns Paginated list of permissions
   */
  const findAllPaginated = async (
    params: PaginationParams = {},
  ): Promise<PaginatedPermissions> => {
    return baseRepository.findAllPaginated(
      params,
    ) as Promise<PaginatedPermissions>;
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
