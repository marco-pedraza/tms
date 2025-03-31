import { db } from '../../db';
import { DuplicateError, NotFoundError } from '../../shared/errors';
import { roles, rolePermissions } from './roles.schema';
import { permissions } from '../permissions/permissions.schema';
import { eq, and, not } from 'drizzle-orm';
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
import { createBaseRepository } from '../../shared/base-repository';
import {
  getRelatedEntities,
  updateManyToManyRelation,
} from '../../shared/db-utils';
import { count } from 'drizzle-orm';

// Error message constants
const ERROR_ROLE_NAME_EXISTS = (name: string) => 
  `Role with name ${name} already exists in this tenant`;
const ERROR_VALIDATE_NAME_UNIQUENESS = (errorMsg: string) => 
  `Failed to validate role name uniqueness: ${errorMsg}`;
const ERROR_PERMISSION_NOT_FOUND = (id: number) => 
  `Permission with id ${id} not found`;
const ERROR_ROLE_NOT_FOUND = (id: number) => 
  `Role with id ${id} not found`;

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
  >(roles, 'Role');

  /**
   * Validates that a role name is unique within a tenant
   * @param name - Name to validate
   * @param tenantId - ID of the tenant
   * @param excludeId - Optional ID to exclude from the check
   * @throws {DuplicateError} If a role with the same name already exists
   */
  const validateUniqueName = async (
    name: string,
    tenantId: number,
    excludeId?: number,
  ): Promise<void> => {
    try {
      let query;
      if (excludeId) {
        query = and(
          eq(roles.name, name),
          eq(roles.tenantId, tenantId),
          not(eq(roles.id, excludeId))
        );
      } else {
        query = and(eq(roles.name, name), eq(roles.tenantId, tenantId));
      }

      const [result] = await db
        .select({ count: count() })
        .from(roles)
        .where(query);

      if (Number(result.count) > 0) {
        throw new DuplicateError(
          ERROR_ROLE_NAME_EXISTS(name),
        );
      }
    } catch (error) {
      if (error instanceof DuplicateError) {
        throw error;
      }
      throw new Error(ERROR_VALIDATE_NAME_UNIQUENESS((error as Error).message));
    }
  };

  /**
   * Creates a new role
   * @param data - Role data to create
   * @returns Created role with permissions
   */
  // TODO Add transaction capabilities to base repository to be able to do a whole transaction with the create role and assign permissions
  const create = async (data: CreateRolePayload): Promise<RoleWithPermissions> => {
    const { permissionIds, ...roleData } = data;
    
    await validateUniqueName(roleData.name, roleData.tenantId);
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
  const findOneWithPermissions = async (id: number): Promise<RoleWithPermissions> => {
    const role = await baseRepository.findOne(id);
    const permissionList = await getRelatedEntities<Permission>(
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
    const role = await baseRepository.findOne(id);

    if (data.name && data.name !== role.name) {
      await validateUniqueName(data.name, role.tenantId, id);
    }

    await baseRepository.update(id, data);
    return findOneWithPermissions(id);
  };

  /**
   * Assigns permissions to a role
   * @param id - ID of the role
   * @param data - Permission IDs to assign
   * @returns Role with updated permissions
   */
  const assignPermissions = async (
    id: number,
    data: AssignPermissionsToRolePayload,
  ): Promise<RoleWithPermissions> => {
    await baseRepository.findOne(id);

    // Validate all permissions exist
    await Promise.all(
      data.permissionIds.map(async (permissionId) => {
        try {
          await permissionRepository.findOne(permissionId);
        } catch (error) {
          if (error instanceof NotFoundError) {
            throw new NotFoundError(ERROR_PERMISSION_NOT_FOUND(permissionId));
          }
          throw error;
        }
      }),
    );

    await updateManyToManyRelation(
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
    includePermissions = false
  ): Promise<PaginatedRoles | PaginatedRolesWithPermissions> => {
    // Use the base repository's findByPaginated method which handles pagination logic
    const result = await baseRepository.findByPaginated(roles.tenantId, tenantId, params);

    if (!includePermissions) {
      return result as PaginatedRoles;
    }

    const rolesWithPermissions = await Promise.all(
      result.data.map(async (role) => {
        return await findOneWithPermissions(role.id);
      })
    );

    return {
      data: rolesWithPermissions,
      pagination: result.pagination,
    };
  };


  const deleteRole = async (id: number): Promise<Role> => {
    try {
      // Use the findOne method to verify the role exists before deletion
      const role = await baseRepository.findOne(id);
      
      // Role permissions will be automatically deleted due to CASCADE
      return baseRepository.delete(id);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError(ERROR_ROLE_NOT_FOUND(id));
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