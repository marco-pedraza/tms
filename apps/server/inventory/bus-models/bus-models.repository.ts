import { busModels } from './bus-models.schema';
import type {
  BusModel,
  CreateBusModelPayload,
  UpdateBusModelPayload,
  BusModels,
  PaginatedBusModels,
} from './bus-models.types';
import { createBaseRepository } from '@repo/base-repo';
import { PaginationParams } from '../../shared/types';
import { db } from '../db-service';

/**
 * Creates a repository for managing bus model entities
 * @returns {Object} An object containing bus model-specific operations and base CRUD operations
 */
export const createBusModelRepository = () => {
  const baseRepository = createBaseRepository<
    BusModel,
    CreateBusModelPayload,
    UpdateBusModelPayload,
    typeof busModels
  >(db, busModels, 'Bus Model');

  /**
   * Creates a new bus model
   * @param data - The bus model data to create
   * @returns {Promise<BusModel>} The created bus model
   */
  const create = async (data: CreateBusModelPayload): Promise<BusModel> => {
    return await baseRepository.create(data);
  };

  /**
   * Updates a bus model
   * @param id - The ID of the bus model to update
   * @param data - The bus model data to update
   * @returns {Promise<BusModel>} The updated bus model
   */
  const update = async (
    id: number,
    data: UpdateBusModelPayload,
  ): Promise<BusModel> => {
    return await baseRepository.update(id, data);
  };

  /**
   * Retrieves all bus models with pagination
   * @param params - Pagination parameters
   * @returns {Promise<PaginatedBusModels>} Paginated list of bus models
   */
  const findAllPaginated = async (
    params: PaginationParams = {},
  ): Promise<PaginatedBusModels> => {
    return await baseRepository.findAllPaginated(params);
  };

  /**
   * Retrieves all bus models
   * @returns {Promise<BusModels>} Object containing array of bus models
   */
  const findAll = async (): Promise<BusModels> => {
    const busModelsList = await baseRepository.findAll();
    return {
      busModels: busModelsList,
    };
  };

  return {
    ...baseRepository,
    create,
    update,
    findAll,
    findAllPaginated,
  };
};

// Export the bus model repository instance
export const busModelRepository = createBusModelRepository();
