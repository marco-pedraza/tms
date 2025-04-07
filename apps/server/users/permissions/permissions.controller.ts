import { api } from 'encore.dev/api';
import { permissionRepository } from './permissions.repository';
import type {
  CreatePermissionPayload,
  UpdatePermissionPayload,
  Permission,
  Permissions,
  PaginatedPermissions,
} from './permissions.types';
import { createControllerErrorHandler } from '../../shared/controller-utils';
import { PaginationParams } from '../../shared/types';

const withErrorHandling = createControllerErrorHandler('PermissionsController');

/**
 * Creates a new permission.
 * @param params - The permission data to create
 * @returns {Promise<Permission>} The created permission
 * @throws {APIError} If the permission creation fails
 */
export const createPermission = api(
  { method: 'POST', path: '/permissions', expose: true, auth: true },
  async (params: CreatePermissionPayload): Promise<Permission> => {
    return withErrorHandling('createPermission', () =>
      permissionRepository.create(params),
    );
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
    return withErrorHandling('getPermission', () =>
      permissionRepository.findOne(id),
    );
  },
);

/**
 * Retrieves all permissions.
 * @returns {Promise<Permissions>} List of all permissions
 * @throws {APIError} If the retrieval fails
 */
export const listPermissions = api(
  { method: 'GET', path: '/permissions', expose: true, auth: true },
  async (): Promise<Permissions> => {
    return withErrorHandling('listPermissions', () =>
      permissionRepository.findAll(),
    );
  },
);

/**
 * Retrieves permissions with pagination.
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedPermissions>} Paginated list of permissions
 * @throws {APIError} If retrieval fails
 */
export const listPermissionsWithPagination = api(
  { method: 'GET', path: '/permissions/paginated', expose: true, auth: true },
  async (params: PaginationParams): Promise<PaginatedPermissions> => {
    return withErrorHandling('listPermissionsWithPagination', () =>
      permissionRepository.findAllPaginated(params),
    );
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
    return withErrorHandling('updatePermission', () =>
      permissionRepository.update(id, data),
    );
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
    return withErrorHandling('deletePermission', () =>
      permissionRepository.delete(id),
    );
  },
);
