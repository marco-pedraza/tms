import { api } from 'encore.dev/api';
import type {
  CreateInstallationTypePayload,
  InstallationType,
  ListInstallationTypesQueryParams,
  ListInstallationTypesResult,
  PaginatedListInstallationTypesQueryParams,
  PaginatedListInstallationTypesResult,
  UpdateInstallationTypePayload,
} from './installation-types.types';
import { installationTypeRepository } from './installation-types.repository';
import { validateInstallationType } from './installation-types.domain';

/**
 * Creates a new installation type.
 * @param params - The installation type data to create
 * @returns {Promise<InstallationType>} The created installation type
 * @throws {APIError} If the installation type creation fails
 */
export const createInstallationType = api(
  { expose: true, method: 'POST', path: '/installation/types/create' },
  async (params: CreateInstallationTypePayload): Promise<InstallationType> => {
    await validateInstallationType(params);
    return await installationTypeRepository.create(params);
  },
);

/**
 * Retrieves an installation type by its ID.
 * @param params - Object containing the installation type ID
 * @param params.id - The ID of the installation type to retrieve
 * @returns {Promise<InstallationType>} The found installation type
 * @throws {APIError} If the installation type is not found or retrieval fails
 */
export const getInstallationType = api(
  { expose: true, method: 'GET', path: '/installation/types/:id' },
  async ({ id }: { id: number }): Promise<InstallationType> => {
    return await installationTypeRepository.findOne(id);
  },
);

/**
 * Updates an existing installation type.
 * @param params - Object containing the installation type ID and update data
 * @param params.id - The ID of the installation type to update
 * @returns {Promise<InstallationType>} The updated installation type
 * @throws {APIError} If the installation type is not found or update fails
 */
export const updateInstallationType = api(
  { expose: true, method: 'PUT', path: '/installation/types/:id/update' },
  async ({
    id,
    ...data
  }: UpdateInstallationTypePayload & {
    id: number;
  }): Promise<InstallationType> => {
    await validateInstallationType(data, id);
    return await installationTypeRepository.update(id, data);
  },
);

/**
 * Retrieves all installation types without pagination (useful for dropdowns).
 * @param params - Query parameters including orderBy, filters, and searchTerm
 * @returns {Promise<ListInstallationTypesResult>} Unified response with data property containing array of installation types
 * @throws {APIError} If retrieval fails
 */
export const listInstallationTypes = api(
  { expose: true, method: 'POST', path: '/installation/types/list/all' },
  async (
    params: ListInstallationTypesQueryParams,
  ): Promise<ListInstallationTypesResult> => {
    const installationTypes = await installationTypeRepository.findAll(params);
    return {
      data: installationTypes,
    };
  },
);

/**
 * Retrieves installation types with pagination (useful for tables).
 * @param params - Pagination and query parameters including page, pageSize, orderBy, filters, and searchTerm
 * @returns {Promise<PaginatedListInstallationTypesResult>} Unified paginated response with data and pagination properties
 * @throws {APIError} If retrieval fails
 */
export const listInstallationTypesPaginated = api(
  { expose: true, method: 'POST', path: '/installation/types/list' },
  async (
    params: PaginatedListInstallationTypesQueryParams,
  ): Promise<PaginatedListInstallationTypesResult> => {
    return await installationTypeRepository.findAllPaginated(params);
  },
);

/**
 * Deletes an installation type by its ID.
 * @param params - Object containing the installation type ID
 * @param params.id - The ID of the installation type to delete
 * @returns {Promise<InstallationType>} The deleted installation type
 * @throws {APIError} If the installation type is not found or deletion fails
 */
export const deleteInstallationType = api(
  { expose: true, method: 'DELETE', path: '/installation/types/:id/delete' },
  async ({ id }: { id: number }): Promise<InstallationType> => {
    return await installationTypeRepository.delete(id);
  },
);
