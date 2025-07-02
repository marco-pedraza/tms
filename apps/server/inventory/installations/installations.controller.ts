import { api } from 'encore.dev/api';
import type {
  CreateNodeInstallationPayload,
  Installation,
  InstallationWithLocation,
  ListInstallationsQueryParams,
  ListInstallationsResult,
  PaginatedListInstallationsQueryParams,
  PaginatedListInstallationsResult,
  UpdateInstallationPayload,
} from './installations.types';
import { installationRepository } from './installations.repository';
import { validateNodeInstallation } from './installations.domain';
import { installationUseCases } from './installations.use-cases';

/**
 * Creates a new installation associated with a node.
 * @param params - The installation data including nodeId, name, and optional description
 * @returns {Promise<InstallationWithLocation>} The created installation with location information from the associated node
 * @throws {APIError} If the node is not found, already has an installation, or creation fails
 */
export const createInstallation = api(
  { expose: true, method: 'POST', path: '/installations/create' },
  async (
    params: CreateNodeInstallationPayload,
  ): Promise<InstallationWithLocation> => {
    await validateNodeInstallation(params);
    const installation =
      await installationUseCases.createNodeInstallation(params);
    return await installationUseCases.findOneWithLocation(installation.id);
  },
);

/**
 * Retrieves an installation by its ID with location information.
 * @param params - Object containing the installation ID
 * @param params.id - The ID of the installation to retrieve
 * @returns {Promise<InstallationWithLocation>} The found installation with location data
 * @throws {APIError} If the installation is not found or retrieval fails
 */
export const getInstallation = api(
  { expose: true, method: 'GET', path: '/installations/:id' },
  async ({ id }: { id: number }): Promise<InstallationWithLocation> => {
    return await installationUseCases.findOneWithLocation(id);
  },
);

/**
 * Updates an existing installation.
 * @param params - Object containing the installation ID and update data
 * @param params.id - The ID of the installation to update
 * @returns {Promise<InstallationWithLocation>} The updated installation with location information
 * @throws {APIError} If the installation is not found or update fails
 */
export const updateInstallation = api(
  { expose: true, method: 'PUT', path: '/installations/:id/update' },
  async ({
    id,
    ...data
  }: UpdateInstallationPayload & {
    id: number;
  }): Promise<InstallationWithLocation> => {
    await installationRepository.update(id, data);
    return await installationUseCases.findOneWithLocation(id);
  },
);

/**
 * Retrieves all installations without pagination (useful for dropdowns).
 * @param params - Query parameters including orderBy, filters, and searchTerm
 * @returns {Promise<ListInstallationsResult>} Unified response with data property containing array of installations
 * @throws {APIError} If retrieval fails
 */
export const listInstallations = api(
  { expose: true, method: 'POST', path: '/installations/list/all' },
  async (
    params: ListInstallationsQueryParams,
  ): Promise<ListInstallationsResult> => {
    const installations = await installationRepository.findAll(params);
    return {
      data: installations,
    };
  },
);

/**
 * Retrieves installations with pagination and includes location information.
 * @param params - Pagination and query parameters including page, pageSize, orderBy, filters, and searchTerm
 * @returns {Promise<PaginatedListInstallationsResult>} Unified paginated response with data and pagination properties
 * @throws {APIError} If retrieval fails
 */
export const listInstallationsPaginated = api(
  { expose: true, method: 'POST', path: '/installations/list' },
  async (
    params: PaginatedListInstallationsQueryParams,
  ): Promise<PaginatedListInstallationsResult> => {
    const installationsResult =
      await installationRepository.findAllPaginated(params);

    return await installationUseCases.appendLocationInfo(
      installationsResult.data,
      installationsResult.pagination,
    );
  },
);

/**
 * Deletes an installation by its ID.
 * @param params - Object containing the installation ID
 * @param params.id - The ID of the installation to delete
 * @returns {Promise<Installation>} The deleted installation
 * @throws {APIError} If the installation is not found or deletion fails
 */
export const deleteInstallation = api(
  { expose: true, method: 'DELETE', path: '/installations/:id/delete' },
  async ({ id }: { id: number }): Promise<Installation> => {
    return await installationRepository.delete(id);
  },
);
