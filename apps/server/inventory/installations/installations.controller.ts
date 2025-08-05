import { api } from 'encore.dev/api';
import type { PropertyInput } from '../installation-properties/installation-properties.types';
import type {
  AssignAmenitiesToInstallationPayload,
  CreateNodeInstallationPayload,
  Installation,
  InstallationWithDetails,
  ListInstallationsQueryParams,
  ListInstallationsResult,
  PaginatedListInstallationsQueryParams,
  PaginatedListInstallationsResult,
  UpdateInstallationPayload,
} from './installations.types';
import { installationRepository } from './installations.repository';
import {
  validateNodeInstallation,
  validateNodeInstallationUpdate,
} from './installations.domain';
import { installationUseCases } from './installations.use-cases';

/**
 * Creates a new installation associated with a node.
 * @param params - The installation data including nodeId, name, and optional description
 * @returns {Promise<InstallationWithDetails>} The created installation with location information from the associated node
 * @throws {APIError} If the node is not found, already has an installation, or creation fails
 */
export const createInstallation = api(
  { expose: true, method: 'POST', path: '/installations/create' },
  async (
    params: CreateNodeInstallationPayload,
  ): Promise<InstallationWithDetails> => {
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
 * @returns {Promise<InstallationWithDetails>} The found installation with location data
 * @throws {APIError} If the installation is not found or retrieval fails
 */
export const getInstallation = api(
  { expose: true, method: 'GET', path: '/installations/:id' },
  async ({ id }: { id: number }): Promise<InstallationWithDetails> => {
    return await installationUseCases.findOneWithLocation(id);
  },
);

/**
 * Updates an existing installation.
 * @param params - Object containing the installation ID and update data
 * @param params.id - The ID of the installation to update
 * @returns {Promise<InstallationWithDetails>} The updated installation with location information
 * @throws {APIError} If the installation is not found or update fails
 */
export const updateInstallation = api(
  { expose: true, method: 'PUT', path: '/installations/:id/update' },
  async ({
    id,
    ...data
  }: UpdateInstallationPayload & {
    id: number;
  }): Promise<InstallationWithDetails> => {
    validateNodeInstallationUpdate(data);
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

/**
 * Updates installation properties by validating and upserting them
 * @param id - The ID of the installation to update properties for
 * @param properties - Array of property name/value pairs to validate and upsert
 * @returns The installation with updated properties
 */
export const updateInstallationProperties = api(
  {
    expose: true,
    method: 'POST',
    path: '/installations/:id/properties/update',
  },
  async ({
    id,
    properties,
  }: {
    id: number;
    properties: PropertyInput[];
  }): Promise<InstallationWithDetails> => {
    return await installationUseCases.updateInstallationProperties(
      id,
      properties,
    );
  },
);

/**
 * Assigns amenities to an installation (destructive operation).
 * This replaces all existing amenity assignments for the installation.
 * @param params - Object containing the installation ID and amenity IDs to assign
 * @param params.id - The ID of the installation to assign amenities to
 * @param params.amenityIds - Array of amenity IDs to assign
 * @returns {Promise<InstallationWithDetails>} The updated installation with new amenity assignments
 * @throws {APIError} If the installation is not found, amenities are not found, or assignment fails
 */
export const assignAmenitiesToInstallation = api(
  {
    expose: true,
    method: 'PUT',
    path: '/installations/:id/amenities/assign',
  },
  async ({
    id,
    amenityIds,
  }: AssignAmenitiesToInstallationPayload & {
    id: number;
  }): Promise<InstallationWithDetails> => {
    return await installationUseCases.assignAmenities(id, amenityIds);
  },
);
