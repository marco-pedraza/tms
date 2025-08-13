import { createBaseRepository } from '@repo/base-repo';
import { errors } from '@/shared/errors';
import { db } from '../db-service';
import { permissions } from './permissions.schema';
import type {
  CreatePermissionPayload,
  Permission,
  UpdatePermissionPayload,
} from './permissions.types';

/**
 * Creates a repository for managing permission entities
 * @returns {Object} An object containing permission-specific operations and base CRUD operations
 */
export function createPermissionRepository() {
  const baseRepository = createBaseRepository<
    Permission,
    CreatePermissionPayload,
    UpdatePermissionPayload,
    typeof permissions
  >(db, permissions, 'Permission', {
    searchableFields: [permissions.name, permissions.code],
  });

  /**
   * Finds a permission by code
   * @param code - The code of the permission to find
   * @returns The found permission
   * @throws {APIError} If the permission is not found
   */
  async function findByCode(code: string): Promise<Permission> {
    const permission = await baseRepository.findBy(permissions.code, code);

    if (!permission) {
      throw errors.notFound(`Permission with code ${code} not found`);
    }

    return permission;
  }

  return {
    ...baseRepository,
    findByCode,
  };
}

// Export the permission repository instance
export const permissionRepository = createPermissionRepository();
