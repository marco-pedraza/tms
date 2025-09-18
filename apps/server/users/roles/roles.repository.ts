import { NotFoundError } from '@repo/base-repo';
import { createBaseRepository } from '@repo/base-repo';
import {
  getRelatedEntities,
  updateManyToManyRelation,
} from '@/shared/db-utils';
import { errors } from '@/shared/errors';
import { db } from '../db-service';
import { permissionRepository } from '../permissions/permissions.repository';
import { permissions } from '../permissions/permissions.schema';
import { Permission } from '../permissions/permissions.types';
import { rolePermissions, roles } from './roles.schema';
import type {
  AssignPermissionsToRolePayload,
  CreateRolePayload,
  PaginatedRoles,
  PaginatedRolesWithPermissions,
  PaginationParamsRoles,
  Role,
  RoleWithPermissions,
  RolesQueryOptions,
  UpdateRolePayload,
} from './roles.types';

// Error message constants
const ERROR_PERMISSION_NOT_FOUND = (id: number) =>
  `Permission with id ${id} not found`;
const ERROR_ROLE_NOT_FOUND = (id: number) => `Role with id ${id} not found`;

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
    searchableFields: [roles.name],
  });

  /**
   * Creates a new role
   * @param data - Role data to create
   * @returns Created role with permissions
   */
  // TODO Add transaction capabilities to base repository to be able to do a whole transaction with the create role and assign permissions
  async function create(data: CreateRolePayload): Promise<RoleWithPermissions> {
    const { permissionIds, ...roleData } = data;

    // The unique constraint will handle the uniqueness validation
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
  async function findAll(options: RolesQueryOptions = {}): Promise<Role[]> {
    const rolesList = await baseRepository.findAll(options);

    if (!options.includePermissions) {
      return rolesList;
    }

    const rolesWithPermissions = await Promise.all(
      rolesList.map(async (role) => {
        return await findOneWithPermissions(role.id);
      }),
    );

    return rolesWithPermissions as Role[];
  }

  /**
   * Finds all roles with pagination, filtering, ordering, and optional permissions
   * @param params - Pagination, filtering, and ordering parameters
   * @returns Paginated roles
   */
  async function findAllPaginated(
    params: PaginationParamsRoles = {},
  ): Promise<PaginatedRoles | PaginatedRolesWithPermissions> {
    const { includePermissions, ...baseParams } = params;
    const result = await baseRepository.findAllPaginated(baseParams);

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
    // The database constraint will validate uniqueness
    await baseRepository.update(id, data);
    return findOneWithPermissions(id);
  }

  /**
   * Assigns permissions to a role
   * @param id - ID of the role
   * @param data - Permission IDs to assign
   * @returns Role with updated permissions
   * @throws {APIError} If role or permissions not found
   */
  async function assignPermissions(
    id: number,
    data: AssignPermissionsToRolePayload,
  ): Promise<RoleWithPermissions> {
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
  }

  /**
   * Searches for roles by matching a search term against name and description
   * @param term - The search term to match against role fields
   * @param options - Additional options for filtering and ordering
   * @returns List of matching roles
   */
  async function search(
    term: string,
    options: RolesQueryOptions = {},
  ): Promise<Role[]> {
    const roles = await baseRepository.search(term);

    if (!options.includePermissions) {
      return roles;
    }

    return (await Promise.all(
      roles.map(async (role) => await findOneWithPermissions(role.id)),
    )) as Role[];
  }

  /**
   * Searches for roles with pagination by matching a search term
   * @param term - The search term to match against role fields
   * @param params - Pagination, filtering, and ordering parameters
   * @returns Paginated list of matching roles
   */
  async function searchPaginated(
    term: string,
    params: PaginationParamsRoles = {},
  ): Promise<PaginatedRoles | PaginatedRolesWithPermissions> {
    const { includePermissions, ...baseParams } = params;
    const result = await baseRepository.searchPaginated(term, baseParams);

    if (!includePermissions) {
      return result as PaginatedRoles;
    }

    const rolesWithPermissions = await Promise.all(
      result.data.map(async (role) => await findOneWithPermissions(role.id)),
    );

    return {
      data: rolesWithPermissions,
      pagination: result.pagination,
    };
  }

  /**
   * Deletes a role
   * @param id - ID of the role to delete
   * @returns The deleted role
   * @throws {APIError} If role not found
   */
  async function deleteRole(id: number): Promise<Role> {
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
  }

  return {
    ...baseRepository,
    create,
    update,
    findOneWithPermissions,
    findAll,
    findAllPaginated,
    assignPermissions,
    search,
    searchPaginated,
    delete: deleteRole,
  };
}

// Export the role repository instance
export const roleRepository = createRoleRepository();
