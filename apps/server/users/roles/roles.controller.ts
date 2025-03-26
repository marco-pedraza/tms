import { api } from 'encore.dev/api';
import { roleHandler } from './roles.handler';
import type {
  CreateRolePayload,
  UpdateRolePayload,
  Role,
  RoleWithPermissions,
  Roles,
  RolesWithPermissions,
  PaginatedRoles,
  PaginatedRolesWithPermissions,
  AssignPermissionsToRolePayload,
} from './roles.types';
import { parseApiError } from '../../shared/errors';
import { PaginationParams } from '../../shared/types';

//TODO Check if controllers can be switched to class, or handler to functions.

/**
 * Creates a new role.
 * @param params - The role data to create
 * @returns {Promise<RoleWithPermissions>} The created role with permissions
 * @throws {APIError} If the role creation fails
 */
export const createRole = api(
  { method: 'POST', path: '/roles', expose: true },
  async (params: CreateRolePayload): Promise<RoleWithPermissions> => {
    try {
      console.log('Creating role with params:', JSON.stringify(params));
      return await roleHandler.create(params);
    } catch (error) {
      console.error('Error creating role:', error);
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Retrieves a role by ID.
 * @param params - Object containing the role ID
 * @param params.id - The ID of the role to retrieve
 * @returns {Promise<Role>} The found role
 * @throws {APIError} If the role is not found or retrieval fails
 */
export const getRole = api(
  { method: 'GET', path: '/roles/:id', expose: true },
  async ({ id }: { id: number }): Promise<Role> => {
    try {
      return await roleHandler.findOne(id);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Retrieves a role by ID with its permissions.
 * @param params - Object containing the role ID
 * @param params.id - The ID of the role to retrieve
 * @returns {Promise<RoleWithPermissions>} The found role with permissions
 * @throws {APIError} If the role is not found or retrieval fails
 */
export const getRoleWithPermissions = api(
  { method: 'GET', path: '/roles/:id/with-permissions', expose: true },
  async ({ id }: { id: number }): Promise<RoleWithPermissions> => {
    try {
      return await roleHandler.findOneWithPermissions(id);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Retrieves all roles.
 * @returns {Promise<Roles>} List of all roles
 * @throws {APIError} If the retrieval fails
 */
export const listRoles = api(
  { method: 'GET', path: '/roles', expose: true },
  async (): Promise<Roles> => {
    try {
      return (await roleHandler.findAll(false)) as Roles;
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Retrieves all roles with their permissions.
 * @returns {Promise<RolesWithPermissions>} List of all roles with permissions
 * @throws {APIError} If the retrieval fails
 */
export const listRolesWithPermissions = api(
  { method: 'GET', path: '/roles/with-permissions', expose: true },
  async (): Promise<RolesWithPermissions> => {
    try {
      return (await roleHandler.findAll(true)) as RolesWithPermissions;
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Retrieves all roles for a tenant.
 * @param params - Object containing the tenant ID
 * @param params.tenantId - The ID of the tenant
 * @returns {Promise<Roles>} List of all roles for the tenant
 * @throws {APIError} If the retrieval fails
 */
export const listRolesByTenant = api(
  { method: 'GET', path: '/tenants/:tenantId/roles', expose: true },
  async ({ tenantId }: { tenantId: number }): Promise<Roles> => {
    try {
      return (await roleHandler.findAllByTenant(tenantId, false)) as Roles;
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Retrieves all roles for a tenant with their permissions.
 * @param params - Object containing the tenant ID
 * @param params.tenantId - The ID of the tenant
 * @returns {Promise<RolesWithPermissions>} List of all roles for the tenant with permissions
 * @throws {APIError} If the retrieval fails
 */
export const listRolesByTenantWithPermissions = api(
  {
    method: 'GET',
    path: '/tenants/:tenantId/roles/with-permissions',
    expose: true,
  },
  async ({ tenantId }: { tenantId: number }): Promise<RolesWithPermissions> => {
    try {
      return (await roleHandler.findAllByTenant(
        tenantId,
        true,
      )) as RolesWithPermissions;
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Retrieves roles with pagination.
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedRoles>} Paginated list of roles
 * @throws {APIError} If retrieval fails
 */
export const listRolesWithPagination = api(
  { method: 'GET', path: '/roles/paginated', expose: true },
  async (params: PaginationParams): Promise<PaginatedRoles> => {
    try {
      return (await roleHandler.findAllPaginated(
        params,
        false,
      )) as PaginatedRoles;
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Retrieves roles with permissions and pagination.
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedRolesWithPermissions>} Paginated list of roles with permissions
 * @throws {APIError} If retrieval fails
 */
export const listRolesWithPermissionsAndPagination = api(
  { method: 'GET', path: '/roles/with-permissions/paginated', expose: true },
  async (params: PaginationParams): Promise<PaginatedRolesWithPermissions> => {
    try {
      return (await roleHandler.findAllPaginated(
        params,
        true,
      )) as PaginatedRolesWithPermissions;
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
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
  { method: 'PUT', path: '/roles/:id', expose: true },
  async ({
    id,
    ...data
  }: UpdateRolePayload & { id: number }): Promise<RoleWithPermissions> => {
    try {
      return await roleHandler.update(id, data);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
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
  { method: 'POST', path: '/roles/:id/permissions', expose: true },
  async ({
    id,
    ...data
  }: AssignPermissionsToRolePayload & {
    id: number;
  }): Promise<RoleWithPermissions> => {
    try {
      return await roleHandler.assignPermissions(id, data);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Deletes a role by ID.
 * @param params - Object containing the role ID
 * @param params.id - The ID of the role to delete
 * @returns {Promise<Role>} The deleted role
 * @throws {APIError} If the role is not found or deletion fails
 */
export const deleteRole = api(
  { method: 'DELETE', path: '/roles/:id', expose: true },
  async ({ id }: { id: number }): Promise<Role> => {
    try {
      return await roleHandler.delete(id);
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Alias for listRolesByTenant to match test case naming.
 * @param params - Object containing the tenant ID
 * @param params.tenantId - The ID of the tenant
 * @returns {Promise<Roles>} List of all roles for the tenant
 * @throws {APIError} If the retrieval fails
 */
export const listTenantRoles = api(
  { method: 'GET', path: '/tenants/:tenantId/roles-alias', expose: true },
  async ({ tenantId }: { tenantId: number }): Promise<Roles> => {
    try {
      return (await roleHandler.findAllByTenant(tenantId, false)) as Roles;
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);

/**
 * Retrieves tenant roles with pagination.
 * @param params - Object containing pagination parameters and tenant ID
 * @param params.tenantId - The ID of the tenant
 * @returns {Promise<PaginatedRoles>} Paginated list of tenant roles
 * @throws {APIError} If retrieval fails
 */
export const listTenantRolesWithPagination = api(
  { method: 'GET', path: '/tenants/:tenantId/roles/paginated', expose: true },
  async ({ tenantId, ...paginationParams }: PaginationParams & { tenantId: number }): Promise<PaginatedRoles> => {
    try {
      return (await roleHandler.findAllByTenantPaginated(
        tenantId,
        paginationParams,
        false
      )) as PaginatedRoles;
    } catch (error) {
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  },
);
