import { api } from 'encore.dev/api';
import type {
  AssignPermissionsToRolePayload,
  CreateRolePayload,
  ListRolesQueryParams,
  ListRolesResult,
  PaginatedListRolesQueryParams,
  PaginatedListRolesResult,
  Role,
  RoleWithPermissions,
  UpdateRolePayload,
} from './roles.types';
import { roleRepository } from './roles.repository';
import { validatePermissionsAssignment, validateRole } from './roles.domain';

/**
 * Creates a new role.
 * @param params - The role data to create
 * @returns {Promise<RoleWithPermissions>} The created role with permissions
 * @throws {APIError} If the role creation fails
 */
export const createRole = api(
  {
    expose: true,
    method: 'POST',
    path: '/roles/create',
    auth: true,
  },
  async (params: CreateRolePayload): Promise<RoleWithPermissions> => {
    await validateRole(params);
    return await roleRepository.create(params);
  },
);

/**
 * Retrieves a role by its ID with its permissions.
 * @param params - Object containing the role ID
 * @param params.id - The ID of the role to retrieve
 * @returns {Promise<RoleWithPermissions>} The found role with permissions
 * @throws {APIError} If the role is not found or retrieval fails
 */
export const getRole = api(
  {
    expose: true,
    method: 'GET',
    path: '/roles/:id',
    auth: true,
  },
  async ({ id }: { id: number }): Promise<RoleWithPermissions> => {
    return await roleRepository.findOneWithPermissions(id);
  },
);

/**
 * Retrieves all roles without pagination (useful for dropdowns).
 * @param params - Query parameters including orderBy, filters, searchTerm, and includePermissions
 * @returns {Promise<ListRolesResult>} Unified response with data property containing array of roles
 * @throws {APIError} If retrieval fails
 */
export const listRoles = api(
  {
    expose: true,
    method: 'POST',
    path: '/roles/list/all',
    auth: true,
  },
  async (params: ListRolesQueryParams): Promise<ListRolesResult> => {
    const roles = await roleRepository.findAll(params);
    return {
      data: roles,
    };
  },
);

/**
 * Retrieves roles with pagination (useful for tables).
 * @param params - Pagination and query parameters including page, pageSize, orderBy, filters, searchTerm, and includePermissions
 * @returns {Promise<PaginatedListRolesResult>} Unified paginated response with data and pagination properties
 * @throws {APIError} If retrieval fails
 */
export const listRolesPaginated = api(
  {
    expose: true,
    method: 'POST',
    path: '/roles/list',
    auth: true,
  },
  async (
    params: PaginatedListRolesQueryParams,
  ): Promise<PaginatedListRolesResult> => {
    return await roleRepository.findAllPaginated(params);
  },
);

/**
 * Updates an existing role.
 * @param params - Object containing the role ID and update data
 * @param params.id - The ID of the role to update
 * @returns {Promise<RoleWithPermissions>} The updated role with permissions
 * @throws {APIError} If the role is not found or update fails
 */
export const updateRole = api(
  {
    expose: true,
    method: 'PUT',
    path: '/roles/:id/update',
    auth: true,
  },
  async ({
    id,
    ...data
  }: UpdateRolePayload & { id: number }): Promise<RoleWithPermissions> => {
    await validateRole(data, id);
    return await roleRepository.update(id, data);
  },
);

/**
 * Assigns permissions to a role.
 * @param params - Object containing the role ID and permission IDs
 * @param params.id - The ID of the role
 * @param params.permissionIds - The IDs of the permissions to assign
 * @returns {Promise<RoleWithPermissions>} The role with updated permissions
 * @throws {APIError} If the role is not found or assignment fails
 */
export const assignPermissionsToRole = api(
  {
    expose: true,
    method: 'POST',
    path: '/roles/:id/permissions',
    auth: true,
  },
  async ({
    id,
    ...data
  }: AssignPermissionsToRolePayload & {
    id: number;
  }): Promise<RoleWithPermissions> => {
    await validatePermissionsAssignment(data);
    return await roleRepository.assignPermissions(id, data);
  },
);

/**
 * Deletes a role by its ID.
 * @param params - Object containing the role ID
 * @param params.id - The ID of the role to delete
 * @returns {Promise<Role>} The deleted role
 * @throws {APIError} If the role is not found or deletion fails
 */
export const deleteRole = api(
  {
    expose: true,
    method: 'DELETE',
    path: '/roles/:id/delete',
    auth: true,
  },
  async ({ id }: { id: number }): Promise<Role> => {
    return await roleRepository.delete(id);
  },
);
