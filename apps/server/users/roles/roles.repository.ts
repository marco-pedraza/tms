import { createBaseRepository } from '@repo/base-repo';
import {
  getRelatedEntities,
  updateManyToManyRelation,
} from '@/shared/db-utils';
import { db } from '../db-service';
import { permissions } from '../permissions/permissions.schema';
import { Permission } from '../permissions/permissions.types';
import { rolePermissions, roles } from './roles.schema';
import type {
  AssignPermissionsToRolePayload,
  CreateRolePayload,
  ListRolesQueryParams,
  PaginatedListRolesQueryParams,
  PaginatedListRolesResult,
  Role,
  RoleWithPermissions,
  UpdateRolePayload,
} from './roles.types';

/**
 * Creates a repository for managing role entities
 * @returns {Object} An object containing role-specific operations and base CRUD operations
 */
export function createRoleRepository() {
  const baseRepository = createBaseRepository<
    Role,
    CreateRolePayload,
    UpdateRolePayload,
    typeof roles
  >(db, roles, 'Role', {
    searchableFields: [roles.name, roles.code],
    softDeleteEnabled: true,
  });

  /**
   * Creates a new role
   * @param data - Role data to create
   * @returns Created role with permissions
   */
  async function create(data: CreateRolePayload): Promise<RoleWithPermissions> {
    const { permissionIds, ...roleData } = data;

    const role = await baseRepository.create(roleData);

    if (permissionIds && permissionIds.length > 0) {
      await assignPermissions(role.id, { permissionIds });
    }

    return findOneWithPermissions(role.id);
  }

  /**
   * Finds a role by ID with its permissions
   * @param id - ID of the role to find
   * @returns Found role with permissions
   */
  async function findOneWithPermissions(
    id: number,
  ): Promise<RoleWithPermissions> {
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
  }

  /**
   * Finds all roles with optional filtering, ordering, and permissions
   * @param options - Query options for filtering, ordering, and including permissions
   * @returns List of roles
   */
  async function findAll(
    options: ListRolesQueryParams = {},
  ): Promise<(Role | RoleWithPermissions)[]> {
    const { includePermissions, ...baseOptions } = options;
    const rolesList = await baseRepository.findAll(baseOptions);

    if (!includePermissions) {
      return rolesList;
    }

    const rolesWithPermissions = await Promise.all(
      rolesList.map(async (role) => {
        return await findOneWithPermissions(role.id);
      }),
    );

    return rolesWithPermissions;
  }

  /**
   * Finds all roles with pagination, filtering, ordering, and optional permissions
   * @param params - Pagination, filtering, and ordering parameters
   * @returns Paginated roles
   */
  async function findAllPaginated(
    params: PaginatedListRolesQueryParams = {},
  ): Promise<PaginatedListRolesResult> {
    const { includePermissions, ...baseParams } = params;
    const result = await baseRepository.findAllPaginated(baseParams);

    if (!includePermissions) {
      return result;
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
  }

  /**
   * Updates a role
   * @param id - ID of the role to update
   * @param data - Role data to update
   * @returns Updated role with permissions
   */
  async function update(
    id: number,
    data: UpdateRolePayload,
  ): Promise<RoleWithPermissions> {
    await baseRepository.update(id, data);
    return findOneWithPermissions(id);
  }

  /**
   * Assigns permissions to a role
   * @param id - ID of the role
   * @param data - Permission IDs to assign
   * @returns Role with updated permissions
   * @throws {NotFoundError} If role not found
   */
  async function assignPermissions(
    id: number,
    data: AssignPermissionsToRolePayload,
  ): Promise<RoleWithPermissions> {
    await baseRepository.findOne(id);

    await updateManyToManyRelation(
      db,
      rolePermissions,
      rolePermissions.roleId,
      id,
      rolePermissions.permissionId,
      data.permissionIds,
    );

    return findOneWithPermissions(id);
  }

  return {
    ...baseRepository,
    create,
    update,
    findOneWithPermissions,
    findAll,
    findAllPaginated,
    assignPermissions,
  };
}

// Export the role repository instance
export const roleRepository = createRoleRepository();
