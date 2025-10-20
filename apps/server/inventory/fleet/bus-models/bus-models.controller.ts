import { api } from 'encore.dev/api';
import type { AssignAmenitiesToEntityPayload } from '@/inventory/shared-entities/amenities/amenities.types';
import type {
  BusModel,
  BusModelWithDetails,
  CreateBusModelPayload,
  ListBusModelsQueryParams,
  ListBusModelsResult,
  PaginatedListBusModelsQueryParams,
  PaginatedListBusModelsResult,
  UpdateBusModelPayload,
} from './bus-models.types';
import { busModelRepository } from './bus-models.repository';
import { busModelDomain } from './bus-models.domain';
import { busModelUseCases } from './bus-models.use-cases';

/**
 * Creates a new bus model.
 * @param params - The bus model data to create
 * @returns {Promise<BusModel>} The created bus model
 * @throws {APIError} If the bus model creation fails
 */
export const createBusModel = api(
  {
    expose: true,
    method: 'POST',
    path: '/bus-models/create',
    auth: true,
  },
  async (params: CreateBusModelPayload): Promise<BusModel> => {
    await busModelDomain.validateBusModel(params);
    return await busModelRepository.create(params);
  },
);

/**
 * Retrieves a bus model by its ID with details (amenities).
 * @param params - Object containing the bus model ID
 * @param params.id - The ID of the bus model to retrieve
 * @returns {Promise<BusModelWithDetails>} The found bus model with details
 * @throws {APIError} If the bus model is not found or retrieval fails
 */
export const getBusModel = api(
  {
    expose: true,
    method: 'GET',
    path: '/bus-models/:id',
    auth: true,
  },
  async ({ id }: { id: number }): Promise<BusModelWithDetails> => {
    return await busModelRepository.findOneWithRelations(id);
  },
);

/**
 * Retrieves all bus models without pagination (useful for dropdowns).
 * @returns {Promise<BusModels>} An object containing an array of bus models
 * @throws {APIError} If retrieval fails
 */
export const listBusModels = api(
  {
    expose: true,
    method: 'POST',
    path: '/bus-models/list/all',
    auth: true,
  },
  async (params: ListBusModelsQueryParams): Promise<ListBusModelsResult> => {
    const busModels = await busModelRepository.findAll(params);
    return {
      data: busModels,
    };
  },
);

/**
 * Retrieves bus models with pagination (useful for tables).
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedBusModels>} Paginated list of bus models
 * @throws {APIError} If retrieval fails
 */
export const listBusModelsPaginated = api(
  {
    expose: true,
    method: 'POST',
    path: '/bus-models/list',
    auth: true,
  },
  async (
    params: PaginatedListBusModelsQueryParams,
  ): Promise<PaginatedListBusModelsResult> => {
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
  {
    expose: true,
    method: 'PUT',
    path: '/bus-models/:id/update',
    auth: true,
  },
  async ({
    id,
    ...data
  }: UpdateBusModelPayload & { id: number }): Promise<BusModel> => {
    await busModelDomain.validateBusModel(data, id);
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
  {
    expose: true,
    method: 'DELETE',
    path: '/bus-models/:id/delete',
    auth: true,
  },
  async ({ id }: { id: number }): Promise<BusModel> => {
    return await busModelRepository.delete(id);
  },
);

/**
 * Assigns amenities to a bus model.
 * @param params - Object containing the bus model ID and amenity assignment data
 * @param params.id - The ID of the bus model to assign amenities to
 * @param params.amenityIds - Array of amenity IDs to assign
 * @returns {Promise<BusModelWithDetails>} The updated bus model with details
 * @throws {APIError} If the bus model is not found or assignment fails
 */
export const assignAmenitiesToBusModel = api(
  {
    expose: true,
    method: 'PUT',
    path: '/bus-models/:id/amenities/assign',
    auth: true,
  },
  async ({
    id,
    amenityIds,
  }: AssignAmenitiesToEntityPayload & {
    id: number;
  }): Promise<BusModelWithDetails> => {
    return await busModelUseCases.assignAmenities(id, amenityIds);
  },
);
