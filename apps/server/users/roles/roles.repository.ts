import { db } from '../db-service';
import { NotFoundError } from '@repo/base-repo';
import { roles, rolePermissions } from './roles.schema';
import { permissions } from '../permissions/permissions.schema';
import { eq } from 'drizzle-orm';
import type {
  Role,
  RoleWithPermissions,
  CreateRolePayload,
  UpdateRolePayload,
  Roles,
  RolesWithPermissions,
  PaginatedRoles,
  PaginatedRolesWithPermissions,
  AssignPermissionsToRolePayload,
} from './roles.types';
import { PaginationParams } from '../../shared/types';
import { Permission } from '../permissions/permissions.types';
import { permissionRepository } from '../permissions/permissions.repository';
import { createBaseRepository } from '@repo/base-repo';
import {
  getRelatedEntities,
  updateManyToManyRelation,
} from '../../shared/db-utils';
import { errors } from '../../shared/errors';

// Error message constants
const ERROR_PERMISSION_NOT_FOUND = (id: number) =>
  `Permission with id ${id} not found`;
const ERROR_ROLE_NOT_FOUND = (id: number) => `Role with id ${id} not found`;

/**
 * Creates a repository for managing role entities
 * @returns {Object} An object containing role-specific operations and base CRUD operations
 */
export const createRoleRepository = () => {
  const baseRepository = createBaseRepository<
    Role,
    CreateRolePayload,
    UpdateRolePayload,
    typeof roles
  >(db, roles, 'Role');

  /**
   * Creates a new role
   * @param data - Role data to create
   * @returns Created role with permissions
   */
  // TODO Add transaction capabilities to base repository to be able to do a whole transaction with the create role and assign permissions
  const create = async (
    data: CreateRolePayload,
  ): Promise<RoleWithPermissions> => {
    const { permissionIds, ...roleData } = data;

    // The unique constraint will handle the uniqueness validation
    const role = await baseRepository.create(roleData);

    if (permissionIds && permissionIds.length > 0) {
      await assignPermissions(role.id, { permissionIds });
    }

    return findOneWithPermissions(role.id);
  };

  /**
   * Finds a role by ID with its permissions
   * @param id - ID of the role to find
   * @returns Found role with permissions
   */
  const findOneWithPermissions = async (
    id: number,
  ): Promise<RoleWithPermissions> => {
    const role = await baseRepository.findOne(id);
    const permissionList = await getRelatedEntities<Permission>(
      db,
      permissions,
      rolePermissions,
      rolePermissions.roleId,
      id,
      rolePermissions.permissionId,
    );

    return {
      ...role,
      permissions: permissionList,
    };
  };

  /**
   * Finds all roles with optional permissions
   * @param includePermissions - Whether to include permissions in the result
   * @returns All roles
   */
  const findAll = async (
    includePermissions = false,
  ): Promise<Roles | RolesWithPermissions> => {
    const rolesList = await baseRepository.findAll();

    if (!includePermissions) {
      return { roles: rolesList };
    }

    const rolesWithPermissions = await Promise.all(
      rolesList.map(async (role) => {
        return await findOneWithPermissions(role.id);
      }),
    );

    return { roles: rolesWithPermissions };
  };

  /**
   * Finds all roles for a tenant
   * @param tenantId - ID of the tenant
   * @param includePermissions - Whether to include permissions in the result
   * @returns All roles for the tenant
   */
  const findAllByTenant = async (
    tenantId: number,
    includePermissions = false,
  ): Promise<Roles | RolesWithPermissions> => {
    const rolesList = await db
      .select()
      .from(roles)
      .where(eq(roles.tenantId, tenantId));

    if (!includePermissions) {
      return { roles: rolesList };
    }

    const rolesWithPermissions = await Promise.all(
      rolesList.map(async (role) => {
        return await findOneWithPermissions(role.id);
      }),
    );

    return { roles: rolesWithPermissions };
  };

  /**
   * Finds all roles with pagination
   * @param params - Pagination parameters
   * @param includePermissions - Whether to include permissions in the result
   * @returns Paginated roles
   */
  const findAllPaginated = async (
    params: PaginationParams,
    includePermissions = false,
  ): Promise<PaginatedRoles | PaginatedRolesWithPermissions> => {
    const result = await baseRepository.findAllPaginated(params);

    if (!includePermissions) {
      return result as PaginatedRoles;
    }

    const rolesWithPermissions = await Promise.all(
      result.data.map(async (role) => {
        return await findOneWithPermissions(role.id);
      }),
    );

    return {
      data: rolesWithPermissions,
      pagination: result.pagination,
    };
  };

  /**
   * Updates a role
   * @param id - ID of the role to update
   * @param data - Role data to update
   * @returns Updated role with permissions
   */
  const update = async (
    id: number,
    data: UpdateRolePayload,
  ): Promise<RoleWithPermissions> => {
    // The database constraint will validate uniqueness
    await baseRepository.update(id, data);
    return findOneWithPermissions(id);
  };

  /**
   * Assigns permissions to a role
   * @param id - ID of the role
   * @param data - Permission IDs to assign
   * @returns Role with updated permissions
   * @throws {APIError} If role or permissions not found
   */
  const assignPermissions = async (
    id: number,
    data: AssignPermissionsToRolePayload,
  ): Promise<RoleWithPermissions> => {
    await baseRepository.findOne(id);

    // Validate all permissions exist
    await Promise.all(
      // TODO fix n+1 query with improved base repository
      data.permissionIds.map(async (permissionId) => {
        try {
          await permissionRepository.findOne(permissionId);
        } catch (error) {
          if (error instanceof NotFoundError) {
            throw errors.notFound(ERROR_PERMISSION_NOT_FOUND(permissionId));
          }
          throw error;
        }
      }),
    );

    await updateManyToManyRelation(
      db,
      rolePermissions,
      rolePermissions.roleId,
      id,
      rolePermissions.permissionId,
      data.permissionIds,
    );

    return findOneWithPermissions(id);
  };

  /**
   * Finds all roles for a tenant with pagination
   * @param tenantId - ID of the tenant
   * @param params - Pagination parameters
   * @param includePermissions - Whether to include permissions in the result
   * @returns Paginated roles for the tenant
   */
  const findAllByTenantPaginated = async (
    tenantId: number,
    params: PaginationParams,
    includePermissions = false,
  ): Promise<PaginatedRoles | PaginatedRolesWithPermissions> => {
    // Use the base repository's findByPaginated method which handles pagination logic
    const result = await baseRepository.findByPaginated(
      roles.tenantId,
      tenantId,
      params,
    );

    if (!includePermissions) {
      return result as PaginatedRoles;
    }

    // TODO fix using db operations inside map with improved base repository
    const rolesWithPermissions = await Promise.all(
      result.data.map(async (role) => {
        return await findOneWithPermissions(role.id);
      }),
    );

    return {
      data: rolesWithPermissions,
      pagination: result.pagination,
    };
  };

  /**
   * Deletes a role
   * @param id - ID of the role to delete
   * @returns The deleted role
   * @throws {APIError} If role not found
   */
  const deleteRole = async (id: number): Promise<Role> => {
    try {
      // Use the findOne method to verify the role exists before deletion
      await baseRepository.findOne(id);

      // Role permissions will be automatically deleted due to CASCADE
      return baseRepository.delete(id);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw errors.notFound(ERROR_ROLE_NOT_FOUND(id));
      }
      throw error;
    }
  };

  return {
    ...baseRepository,
    create,
    update,
    findOneWithPermissions,
    findAll,
    findAllByTenant,
    findAllPaginated,
    findAllByTenantPaginated,
    assignPermissions,
    delete: deleteRole,
  };
};

// Export the role repository instance
export const roleRepository = createRoleRepository();
