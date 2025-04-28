import { api } from 'encore.dev/api';
import { pathwayServiceRepository } from './pathway-services.repository';
import {
  CreatePathwayServicePayload,
  UpdatePathwayServicePayload,
  PathwayService,
  PathwayServices,
  PaginatedPathwayServices,
} from './pathway-services.types';
import { PaginationParams } from '../../shared/types';

/**
 * Creates a new pathway service.
 * @param params - The pathway service data to create
 * @returns {Promise<PathwayService>} The created pathway service
 * @throws {APIError} If the pathway service creation fails
 */
export const createPathwayService = api(
  { method: 'POST', path: '/pathway-services', expose: true },
  async (params: CreatePathwayServicePayload): Promise<PathwayService> => {
    return await pathwayServiceRepository.create(params);
  },
);

/**
 * Retrieves a pathway service by its ID.
 * @param params - Object containing the pathway service ID
 * @param params.id - The ID of the pathway service to retrieve
 * @returns {Promise<PathwayService>} The found pathway service
 * @throws {APIError} If the pathway service is not found or retrieval fails
 */
export const getPathwayService = api(
  { method: 'GET', path: '/pathway-services/:id', expose: true },
  async ({ id }: { id: number }): Promise<PathwayService> => {
    return await pathwayServiceRepository.findOne(id);
  },
);

/**
 * Retrieves all pathway services without pagination (useful for dropdowns).
 * @returns {Promise<PathwayServices>} An object containing an array of pathway services
 * @throws {APIError} If retrieval fails
 */
export const listPathwayServices = api(
  { method: 'GET', path: '/pathway-services', expose: true },
  async (): Promise<PathwayServices> => {
    const result = await pathwayServiceRepository.findAll();
    return {
      pathwayServices: result,
    };
  },
);

/**
 * Retrieves pathway services with pagination (useful for tables).
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedPathwayServices>} Paginated list of pathway services
 * @throws {APIError} If retrieval fails
 */
export const listPathwayServicesPaginated = api(
  { method: 'GET', path: '/pathway-services/paginated', expose: true },
  async (params: PaginationParams): Promise<PaginatedPathwayServices> => {
    return await pathwayServiceRepository.findAllPaginated(params);
  },
);

/**
 * Updates an existing pathway service.
 * @param params - Object containing the pathway service ID and update data
 * @param params.id - The ID of the pathway service to update
 * @param params.data - The pathway service data to update
 * @returns {Promise<PathwayService>} The updated pathway service
 * @throws {APIError} If the pathway service is not found or update fails
 */
export const updatePathwayService = api(
  { method: 'PUT', path: '/pathway-services/:id', expose: true },
  async ({
    id,
    ...data
  }: UpdatePathwayServicePayload & { id: number }): Promise<PathwayService> => {
    return await pathwayServiceRepository.update(id, data);
  },
);

/**
 * Deletes a pathway service by its ID.
 * @param params - Object containing the pathway service ID
 * @param params.id - The ID of the pathway service to delete
 * @returns {Promise<PathwayService>} The deleted pathway service
 * @throws {APIError} If the pathway service is not found or deletion fails
 */
export const deletePathwayService = api(
  { method: 'DELETE', path: '/pathway-services/:id', expose: true },
  async ({ id }: { id: number }): Promise<PathwayService> => {
    return await pathwayServiceRepository.delete(id);
  },
);
