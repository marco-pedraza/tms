import { api } from 'encore.dev/api';
import type {
  CreatePermissionGroupPayload,
  PermissionGroup,
  PermissionGroups,
  UpdatePermissionGroupPayload,
} from './permission-groups.types';
import { permissionGroupRepository } from './permission-groups.repository';

/**
 * Creates a new permission group.
 * @param params - The permission group data to create
 * @returns {Promise<PermissionGroup>} The created permission group
 * @throws {APIError} If the permission group creation fails
 */
export const createPermissionGroup = api(
  {
    expose: true,
    method: 'POST',
    path: '/permission-groups',
    auth: true,
  },
  async (params: CreatePermissionGroupPayload): Promise<PermissionGroup> => {
    return await permissionGroupRepository.create(params);
  },
);

/**
 * Retrieves all permission groups.
 * @returns {Promise<PermissionGroups>} An object containing an array of permission groups
 * @throws {APIError} If the retrieval fails
 */
export const listPermissionGroups = api(
  {
    expose: true,
    method: 'GET',
    path: '/permission-groups',
    auth: true,
  },
  async (): Promise<PermissionGroups> => {
    return await permissionGroupRepository.findAll();
  },
);

/**
 * Updates an existing permission group.
 * @param id - The ID of the permission group to update
 * @param data - The permission group data to update
 * @returns {Promise<PermissionGroup>} The updated permission group
 * @throws {APIError} If the permission group is not found or update fails
 */
export const updatePermissionGroup = api(
  {
    expose: true,
    method: 'PUT',
    path: '/permission-groups/:id',
    auth: true,
  },
  async ({
    id,
    ...data
  }: UpdatePermissionGroupPayload & {
    id: number;
  }): Promise<PermissionGroup> => {
    return await permissionGroupRepository.update(id, data);
  },
);

/**
 * Deletes a permission group by its ID.
 * @param id - The ID of the permission group to delete
 * @returns {Promise<PermissionGroup>} The deleted permission group
 * @throws {APIError} If the permission group is not found or deletion fails
 */
export const deletePermissionGroup = api(
  {
    expose: true,
    method: 'DELETE',
    path: '/permission-groups/:id',
    auth: true,
  },
  async ({ id }: { id: number }): Promise<PermissionGroup> => {
    return await permissionGroupRepository.delete(id);
  },
);
