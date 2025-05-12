import { api } from 'encore.dev/api';
import type {
  AssignPermissionsToRolePayload,
  CreateRolePayload,
  PaginatedRoles,
  PaginatedRolesWithPermissions,
  PaginationParamsRoles,
  Role,
  RoleWithPermissions,
  Roles,
  RolesQueryOptions,
  RolesWithPermissions,
  UpdateRolePayload,
} from './roles.types';
import { roleRepository } from './roles.repository';

/**
 * Creates a new role.
 * @param params - The role data to create
 * @returns {Promise<RoleWithPermissions>} The created role with permissions
 * @throws {APIError} If the role creation fails
 */
export const createRole = api(
  { method: 'POST', path: '/roles', expose: true, auth: true },
  async (params: CreateRolePayload): Promise<RoleWithPermissions> => {
    return await roleRepository.create(params);
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
  { method: 'GET', path: '/roles/:id', expose: true, auth: true },
  async ({ id }: { id: number }): Promise<Role> => {
    return await roleRepository.findOne(id);
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
  {
    method: 'GET',
    path: '/roles/:id/with-permissions',
    expose: true,
    auth: true,
  },
  async ({ id }: { id: number }): Promise<RoleWithPermissions> => {
    return await roleRepository.findOneWithPermissions(id);
  },
);

/**
 * Retrieves all roles with optional filtering, ordering, and permissions.
 * @param params - Query options for filtering, ordering, and including permissions
 * @returns {Promise<Roles>} List of roles
 * @throws {APIError} If the retrieval fails
 */
export const listRoles = api(
  { method: 'POST', path: '/get-roles', expose: true, auth: true },
  async (params: RolesQueryOptions): Promise<Roles> => {
    const roles = await roleRepository.findAll(params);
    return { roles };
  },
);

/**
 * Retrieves all roles with their permissions (maintains backward compatibility).
 * @returns {Promise<RolesWithPermissions>} List of all roles with permissions
 * @throws {APIError} If the retrieval fails
 */
export const listRolesWithPermissions = api(
  { method: 'GET', path: '/roles/with-permissions', expose: true, auth: true },
  async (): Promise<RolesWithPermissions> => {
    const roles = await roleRepository.findAll({ includePermissions: true });
    return { roles: roles as RoleWithPermissions[] };
  },
);

/**
 * Retrieves all roles for a tenant with optional filtering and ordering.
 * @param params - Object containing the tenant ID and query options
 * @param params.tenantId - The ID of the tenant
 * @returns {Promise<Roles>} List of roles for the tenant
 * @throws {APIError} If the retrieval fails
 */
export const listRolesByTenant = api(
  {
    method: 'POST',
    path: '/tenants/:tenantId/get-roles',
    expose: true,
    auth: true,
  },
  async ({
    tenantId,
    ...options
  }: { tenantId: number } & RolesQueryOptions): Promise<Roles> => {
    const roles = await roleRepository.findAllByTenant(tenantId, options);
    return { roles };
  },
);

/**
 * Retrieves all roles for a tenant with permissions (maintains backward compatibility).
 * @param params - Object containing the tenant ID
 * @param params.tenantId - The ID of the tenant
 * @returns {Promise<RolesWithPermissions>} List of roles for the tenant with permissions
 * @throws {APIError} If the retrieval fails
 */
export const listRolesByTenantWithPermissions = api(
  {
    method: 'GET',
    path: '/tenants/:tenantId/roles/with-permissions',
    expose: true,
    auth: true,
  },
  async ({ tenantId }: { tenantId: number }): Promise<RolesWithPermissions> => {
    const roles = await roleRepository.findAllByTenant(tenantId, {
      includePermissions: true,
    });
    return { roles: roles as RoleWithPermissions[] };
  },
);

/**
 * Retrieves roles with pagination, filtering, and ordering.
 * @param params - Pagination, filtering, and ordering parameters
 * @returns {Promise<PaginatedRoles>} Paginated list of roles
 * @throws {APIError} If retrieval fails
 */
export const listRolesWithPagination = api(
  { method: 'POST', path: '/get-roles/paginated', expose: true, auth: true },
  async (params: PaginationParamsRoles): Promise<PaginatedRoles> => {
    return (await roleRepository.findAllPaginated(params)) as PaginatedRoles;
  },
);

/**
 * Retrieves roles with permissions and pagination (maintains backward compatibility).
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedRolesWithPermissions>} Paginated list of roles with permissions
 * @throws {APIError} If retrieval fails
 */
export const listRolesWithPermissionsAndPagination = api(
  {
    method: 'GET',
    path: '/roles/with-permissions/paginated',
    expose: true,
    auth: true,
  },
  async (
    params: PaginationParamsRoles,
  ): Promise<PaginatedRolesWithPermissions> => {
    return (await roleRepository.findAllPaginated({
      ...params,
      includePermissions: true,
    })) as PaginatedRolesWithPermissions;
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
  { method: 'PUT', path: '/roles/:id', expose: true, auth: true },
  async ({
    id,
    ...data
  }: UpdateRolePayload & { id: number }): Promise<RoleWithPermissions> => {
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
  { method: 'POST', path: '/roles/:id/permissions', expose: true, auth: true },
  async ({
    id,
    ...data
  }: AssignPermissionsToRolePayload & {
    id: number;
  }): Promise<RoleWithPermissions> => {
    return await roleRepository.assignPermissions(id, data);
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
  { method: 'DELETE', path: '/roles/:id', expose: true, auth: true },
  async ({ id }: { id: number }): Promise<Role> => {
    return await roleRepository.delete(id);
  },
);

/**
 * Retrieves roles for a tenant with pagination, filtering, and ordering.
 * @param params - Object containing the tenant ID and pagination parameters
 * @param params.tenantId - The ID of the tenant
 * @returns {Promise<PaginatedRoles>} Paginated list of roles for the tenant
 * @throws {APIError} If retrieval fails
 */
export const listRolesByTenantWithPagination = api(
  {
    method: 'POST',
    path: '/tenants/:tenantId/get-roles/paginated',
    expose: true,
    auth: true,
  },
  async ({
    tenantId,
    ...params
  }: PaginationParamsRoles & { tenantId: number }): Promise<PaginatedRoles> => {
    return (await roleRepository.findAllByTenantPaginated(
      tenantId,
      params,
    )) as PaginatedRoles;
  },
);

/**
 * Searches for roles by matching a search term against name and description.
 * @param params - Search parameters
 * @param params.term - The search term to match against role fields
 * @returns {Promise<Roles>} List of matching roles
 * @throws {APIError} If search fails or no searchable fields are configured
 */
export const searchRoles = api(
  { method: 'GET', path: '/roles/search', expose: true, auth: true },
  async ({
    term,
    ...options
  }: { term: string } & RolesQueryOptions): Promise<Roles> => {
    const roles = await roleRepository.search(term, options);
    return { roles };
  },
);

/**
 * Searches for roles with pagination by matching a search term.
 * @param params - Search and pagination parameters
 * @param params.term - The search term to match against role fields
 * @returns {Promise<PaginatedRoles>} Paginated list of matching roles
 * @throws {APIError} If search fails or no searchable fields are configured
 */
export const searchRolesPaginated = api(
  { method: 'POST', path: '/roles/search/paginated', expose: true, auth: true },
  async ({
    term,
    ...params
  }: PaginationParamsRoles & { term: string }): Promise<PaginatedRoles> => {
    return (await roleRepository.searchPaginated(
      term,
      params,
    )) as PaginatedRoles;
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
  {
    method: 'GET',
    path: '/tenants/:tenantId/roles-alias',
    expose: true,
    auth: true,
  },
  async ({ tenantId }: { tenantId: number }): Promise<Roles> => {
    const roles = await roleRepository.findAllByTenant(tenantId, {});
    return { roles };
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
  {
    method: 'GET',
    path: '/tenants/:tenantId/roles-paginated',
    expose: true,
    auth: true,
  },
  async ({
    tenantId,
    ...paginationParams
  }: PaginationParamsRoles & { tenantId: number }): Promise<PaginatedRoles> => {
    return (await roleRepository.findAllByTenantPaginated(
      tenantId,
      paginationParams,
    )) as PaginatedRoles;
  },
);
