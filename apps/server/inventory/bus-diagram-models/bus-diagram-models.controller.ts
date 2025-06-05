import { api } from 'encore.dev/api';
import { PaginationParams } from '../../shared/types';
import {
  BusDiagramModel,
  BusDiagramModels,
  CreateBusDiagramModelPayload,
  PaginatedBusDiagramModels,
  UpdateBusDiagramModelPayload,
} from './bus-diagram-models.types';
import { busDiagramModelRepository } from './bus-diagram-models.repository';
import { busDiagramModelUseCases } from './bus-diagram-models.use-cases';

/**
 * Creates a new bus diagram model and automatically generates seat models in a single transaction.
 * @param params - Data for the new bus diagram model
 * @returns {Promise<BusDiagramModel>} The created bus diagram model
 * @throws {APIError} If creation fails or validation fails
 */
export const createBusDiagramModel = api(
  { expose: true, method: 'POST', path: '/bus-diagram-models' },
  async (params: CreateBusDiagramModelPayload): Promise<BusDiagramModel> => {
    return await busDiagramModelUseCases.createBusDiagramModelWithSeats(params);
  },
);

/**
 * Retrieves a bus diagram model by its ID.
 * @param params - Object containing the bus diagram model ID
 * @param params.id - The ID of the bus diagram model to retrieve
 * @returns {Promise<BusDiagramModel>} The requested bus diagram model
 * @throws {APIError} If retrieval fails or the bus diagram model doesn't exist
 */
export const getBusDiagramModel = api(
  { expose: true, method: 'GET', path: '/bus-diagram-models/:id' },
  async ({ id }: { id: number }): Promise<BusDiagramModel> => {
    return await busDiagramModelRepository.findOne(id);
  },
);

/**
 * Retrieves all bus diagram models without pagination (useful for dropdowns).
 * @returns {Promise<BusDiagramModels>} List of all bus diagram models
 * @throws {APIError} If retrieval fails
 */
export const listBusDiagramModels = api(
  { expose: true, method: 'POST', path: '/get-bus-diagram-models' },
  async (): Promise<BusDiagramModels> => {
    const { busDiagramModels: models } =
      await busDiagramModelRepository.findAll();
    return {
      busDiagramModels: models,
    };
  },
);

/**
 * Retrieves bus diagram models with pagination (useful for tables).
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedBusDiagramModels>} Paginated list of bus diagram models
 * @throws {APIError} If retrieval fails
 */
export const listBusDiagramModelsPaginated = api(
  { expose: true, method: 'POST', path: '/get-bus-diagram-models/paginated' },
  async (params: PaginationParams): Promise<PaginatedBusDiagramModels> => {
    return await busDiagramModelRepository.findAllPaginated(params);
  },
);

/**
 * Updates an existing bus diagram model.
 * @param params - Object containing the bus diagram model ID and update data
 * @param params.id - The ID of the bus diagram model to update
 * @param params.data - The bus diagram model data to update
 * @returns {Promise<BusDiagramModel>} The updated bus diagram model
 * @throws {APIError} If update fails, validation fails, or the bus diagram model doesn't exist
 */
export const updateBusDiagramModel = api(
  { expose: true, method: 'PATCH', path: '/bus-diagram-models/:id' },
  async ({
    id,
    ...data
  }: UpdateBusDiagramModelPayload & {
    id: number;
  }): Promise<BusDiagramModel> => {
    return await busDiagramModelRepository.update(id, data);
  },
);

/**
 * Deletes a bus diagram model by its ID.
 * @param params - Object containing the bus diagram model ID
 * @param params.id - The ID of the bus diagram model to delete
 * @returns {Promise<BusDiagramModel>} The deleted bus diagram model
 * @throws {APIError} If deletion fails or the bus diagram model doesn't exist
 */
export const deleteBusDiagramModel = api(
  { expose: true, method: 'DELETE', path: '/bus-diagram-models/:id' },
  async ({ id }: { id: number }): Promise<BusDiagramModel> => {
    return await busDiagramModelRepository.delete(id);
  },
);
