import { api } from 'encore.dev/api';
import { roleRepository } from './roles.repository';
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
import { createControllerErrorHandler } from '../../shared/controller-utils';
import { PaginationParams } from '../../shared/types';

const withErrorHandling = createControllerErrorHandler('RolesController');

/**
 * Creates a new role.
 * @param params - The role data to create
 * @returns {Promise<RoleWithPermissions>} The created role with permissions
 * @throws {APIError} If the role creation fails
 */
export const createRole = api(
  { method: 'POST', path: '/roles', expose: true },
  async (params: CreateRolePayload): Promise<RoleWithPermissions> => {
    return withErrorHandling('createRole', () => 
      roleRepository.create(params)
    );
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
    return withErrorHandling('getRole', () =>
      roleRepository.findOne(id)
    );
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
    return withErrorHandling('getRoleWithPermissions', () =>
      roleRepository.findOneWithPermissions(id)
    );
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
    return withErrorHandling('listRoles', () =>
      roleRepository.findAll(false) as Promise<Roles>
    );
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
    return withErrorHandling('listRolesWithPermissions', () =>
      roleRepository.findAll(true) as Promise<RolesWithPermissions>
    );
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
    return withErrorHandling('listRolesByTenant', () =>
      roleRepository.findAllByTenant(tenantId, false) as Promise<Roles>
    );
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
    return withErrorHandling('listRolesByTenantWithPermissions', () =>
      roleRepository.findAllByTenant(tenantId, true) as Promise<RolesWithPermissions>
    );
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
    return withErrorHandling('listRolesWithPagination', () =>
      roleRepository.findAllPaginated(params, false) as Promise<PaginatedRoles>
    );
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
    return withErrorHandling('listRolesWithPermissionsAndPagination', () =>
      roleRepository.findAllPaginated(params, true) as Promise<PaginatedRolesWithPermissions>
    );
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
    return withErrorHandling('updateRole', () =>
      roleRepository.update(id, data)
    );
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
    return withErrorHandling('assignPermissionsToRole', () =>
      roleRepository.assignPermissions(id, data)
    );
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
    return withErrorHandling('deleteRole', () =>
      roleRepository.delete(id)
    );
  },
);

/**
 * Retrieves roles for a tenant with pagination.
 * @param params - Object containing the tenant ID and pagination parameters
 * @param params.tenantId - The ID of the tenant
 * @returns {Promise<PaginatedRoles>} Paginated list of roles for the tenant
 * @throws {APIError} If retrieval fails
 */
export const listRolesByTenantWithPagination = api(
  { method: 'GET', path: '/tenants/:tenantId/roles/paginated', expose: true },
  async ({
    tenantId,
    ...params
  }: PaginationParams & { tenantId: number }): Promise<PaginatedRoles> => {
    return withErrorHandling('listRolesByTenantWithPagination', () =>
      roleRepository.findAllByTenantPaginated(tenantId, params, false) as Promise<PaginatedRoles>
    );
  },
);

/**
 * Retrieves roles for a tenant with permissions and pagination.
 * @param params - Object containing the tenant ID and pagination parameters
 * @param params.tenantId - The ID of the tenant
 * @returns {Promise<PaginatedRolesWithPermissions>} Paginated list of roles for the tenant with permissions
 * @throws {APIError} If retrieval fails
 */
export const listRolesByTenantWithPermissionsAndPagination = api(
  {
    method: 'GET',
    path: '/tenants/:tenantId/roles/with-permissions/paginated',
    expose: true,
  },
  async ({
    tenantId,
    ...params
  }: PaginationParams & {
    tenantId: number;
  }): Promise<PaginatedRolesWithPermissions> => {
    return withErrorHandling('listRolesByTenantWithPermissionsAndPagination', () =>
      roleRepository.findAllByTenantPaginated(tenantId, params, true) as Promise<PaginatedRolesWithPermissions>
    );
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
    return withErrorHandling('listTenantRoles', () =>
      roleRepository.findAllByTenant(tenantId, false) as Promise<Roles>
    );
  },
);

/**
 * Alias for listRolesByTenantWithPagination to match test case naming.
 * @param params - Object containing pagination parameters and tenant ID
 * @param params.tenantId - The ID of the tenant
 * @returns {Promise<PaginatedRoles>} Paginated list of tenant roles
 * @throws {APIError} If retrieval fails
 */
export const listTenantRolesWithPagination = api(
  { method: 'GET', path: '/tenants/:tenantId/roles-paginated', expose: true },
  async ({ tenantId, ...paginationParams }: PaginationParams & { tenantId: number }): Promise<PaginatedRoles> => {
    return withErrorHandling('listTenantRolesWithPagination', () =>
      roleRepository.findAllByTenantPaginated(tenantId, paginationParams, false) as Promise<PaginatedRoles>
    );
  },
);
