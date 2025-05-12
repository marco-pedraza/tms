import { api } from 'encore.dev/api';
import type {
  CreatePermissionPayload,
  PaginatedPermissions,
  PaginationParamsPermissions,
  Permission,
  Permissions,
  PermissionsQueryOptions,
  UpdatePermissionPayload,
} from './permissions.types';
import { permissionRepository } from './permissions.repository';

/**
 * Creates a new permission.
 * @param params - The permission data to create
 * @returns {Promise<Permission>} The created permission
 * @throws {APIError} If the permission creation fails
 */
export const createPermission = api(
  { method: 'POST', path: '/permissions', expose: true, auth: true },
  async (params: CreatePermissionPayload): Promise<Permission> => {
    return await permissionRepository.create(params);
  },
);

/**
 * Retrieves a permission by ID.
 * @param params - Object containing the permission ID
 * @param params.id - The ID of the permission to retrieve
 * @returns {Promise<Permission>} The found permission
 * @throws {APIError} If the permission is not found or retrieval fails
 */
export const getPermission = api(
  { method: 'GET', path: '/permissions/:id', expose: true, auth: true },
  async ({ id }: { id: number }): Promise<Permission> => {
    return await permissionRepository.findOne(id);
  },
);

/**
 * Retrieves all permissions with optional filtering and ordering.
 * @param params - Query options for filtering and ordering
 * @returns {Promise<Permissions>} List of all permissions
 * @throws {APIError} If the retrieval fails
 */
export const listPermissions = api(
  { method: 'POST', path: '/get-permissions', expose: true, auth: true },
  async (params: PermissionsQueryOptions): Promise<Permissions> => {
    const permissions = await permissionRepository.findAll(params);
    return {
      permissions,
    };
  },
);

/**
 * Retrieves permissions with pagination, filtering, and ordering.
 * @param params - Pagination, filtering, and ordering parameters
 * @returns {Promise<PaginatedPermissions>} Paginated list of permissions
 * @throws {APIError} If retrieval fails
 */
export const listPermissionsWithPagination = api(
  {
    method: 'POST',
    path: '/get-permissions/paginated',
    expose: true,
    auth: true,
  },
  async (
    params: PaginationParamsPermissions,
  ): Promise<PaginatedPermissions> => {
    return await permissionRepository.findAllPaginated(params);
  },
);

/**
 * Updates an existing permission.
 * @param params - Object containing the permission ID and update data
 * @param params.id - The ID of the permission to update
 * @returns {Promise<Permission>} The updated permission
 * @throws {APIError} If the permission is not found or update fails
 */
export const updatePermission = api(
  { method: 'PUT', path: '/permissions/:id', expose: true, auth: true },
  async ({
    id,
    ...data
  }: UpdatePermissionPayload & { id: number }): Promise<Permission> => {
    return await permissionRepository.update(id, data);
  },
);

/**
 * Deletes a permission by ID.
 * @param params - Object containing the permission ID
 * @param params.id - The ID of the permission to delete
 * @returns {Promise<Permission>} The deleted permission
 * @throws {APIError} If the permission is not found or deletion fails
 */
export const deletePermission = api(
  { method: 'DELETE', path: '/permissions/:id', expose: true, auth: true },
  async ({ id }: { id: number }): Promise<Permission> => {
    return await permissionRepository.delete(id);
  },
);

/**
 * Searches for permissions by matching a search term against name, code, and description.
 * @param params - Search parameters
 * @param params.term - The search term to match against permission fields
 * @returns {Promise<Permissions>} List of matching permissions
 * @throws {APIError} If search fails or no searchable fields are configured
 */
export const searchPermissions = api(
  { method: 'GET', path: '/permissions/search', expose: true, auth: true },
  async ({ term }: { term: string }): Promise<Permissions> => {
    const permissions = await permissionRepository.search(term);
    return {
      permissions,
    };
  },
);

/**
 * Searches for permissions with pagination by matching a search term against name, code, and description.
 * @param params - Search and pagination parameters
 * @param params.term - The search term to match against permission fields
 * @param params.page - Page number for pagination (optional, default: 1)
 * @param params.pageSize - Number of items per page (optional, default: 10)
 * @param params.orderBy - Sorting criteria (optional)
 * @param params.filters - Additional filters to apply (optional)
 * @returns {Promise<PaginatedPermissions>} Paginated list of matching permissions
 * @throws {APIError} If search fails or no searchable fields are configured
 */
export const searchPermissionsPaginated = api(
  {
    method: 'POST',
    path: '/permissions/search/paginated',
    expose: true,
    auth: true,
  },
  async ({
    term,
    ...params
  }: PaginationParamsPermissions & {
    term: string;
  }): Promise<PaginatedPermissions> => {
    return await permissionRepository.searchPaginated(term, params);
  },
);
