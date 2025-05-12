import { api } from 'encore.dev/api';
import { PaginationParams } from '../../shared/types';
import {
  BusModel,
  BusModels,
  CreateBusModelPayload,
  PaginatedBusModels,
  UpdateBusModelPayload,
} from './bus-models.types';
import { busModelRepository } from './bus-models.repository';

/**
 * Creates a new bus model.
 * @param params - The bus model data to create
 * @returns {Promise<BusModel>} The created bus model
 * @throws {APIError} If the bus model creation fails
 */
export const createBusModel = api(
  { method: 'POST', path: '/bus-models', expose: true },
  async (params: CreateBusModelPayload): Promise<BusModel> => {
    return await busModelRepository.create(params);
  },
);

/**
 * Retrieves a bus model by its ID.
 * @param params - Object containing the bus model ID
 * @param params.id - The ID of the bus model to retrieve
 * @returns {Promise<BusModel>} The found bus model
 * @throws {APIError} If the bus model is not found or retrieval fails
 */
export const getBusModel = api(
  { method: 'GET', path: '/bus-models/:id', expose: true },
  async ({ id }: { id: number }): Promise<BusModel> => {
    return await busModelRepository.findOne(id);
  },
);

/**
 * Retrieves all bus models without pagination (useful for dropdowns).
 * @returns {Promise<BusModels>} An object containing an array of bus models
 * @throws {APIError} If retrieval fails
 */
export const listBusModels = api(
  { method: 'GET', path: '/bus-models', expose: true },
  async (): Promise<BusModels> => {
    return await busModelRepository.findAll();
  },
);

/**
 * Retrieves bus models with pagination (useful for tables).
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedBusModels>} Paginated list of bus models
 * @throws {APIError} If retrieval fails
 */
export const listBusModelsPaginated = api(
  { method: 'GET', path: '/bus-models/paginated', expose: true },
  async (params: PaginationParams): Promise<PaginatedBusModels> => {
    return await busModelRepository.findAllPaginated(params);
  },
);

/**
 * Updates an existing bus model.
 * @param params - Object containing the bus model ID and update data
 * @param params.id - The ID of the bus model to update
 * @param params.data - The bus model data to update
 * @returns {Promise<BusModel>} The updated bus model
 * @throws {APIError} If the bus model is not found or update fails
 */
export const updateBusModel = api(
  { method: 'PUT', path: '/bus-models/:id', expose: true },
  async ({
    id,
    ...data
  }: UpdateBusModelPayload & { id: number }): Promise<BusModel> => {
    return await busModelRepository.update(id, data);
  },
);

/**
 * Deletes a bus model by its ID.
 * @param params - Object containing the bus model ID
 * @param params.id - The ID of the bus model to delete
 * @returns {Promise<BusModel>} The deleted bus model
 * @throws {APIError} If the bus model is not found or deletion fails
 */
export const deleteBusModel = api(
  { method: 'DELETE', path: '/bus-models/:id', expose: true },
  async ({ id }: { id: number }): Promise<BusModel> => {
    return await busModelRepository.delete(id);
  },
);
