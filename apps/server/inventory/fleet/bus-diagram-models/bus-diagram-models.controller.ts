import { api } from 'encore.dev/api';
import {
  UpdateSeatConfigurationPayload,
  UpdatedSeatConfiguration,
} from '@/inventory/fleet/bus-seat-models/bus-seat-models.types';
import { ListBusSeatModelsResult } from '@/inventory/fleet/bus-seat-models/bus-seat-models.types';
import { busSeatModelUseCases } from '@/inventory/fleet/bus-seat-models/bus-seat-models.use-cases';
import {
  BusDiagramModel,
  CreateBusDiagramModelPayload,
  ListBusDiagramModelsQueryParams,
  ListBusDiagramModelsResult,
  PaginatedListBusDiagramModelsQueryParams,
  PaginatedListBusDiagramModelsResult,
  RegenerateSeatsResponse,
  UpdateBusDiagramModelPayload,
} from './bus-diagram-models.types';
import { busDiagramModelRepository } from './bus-diagram-models.repository';
import { validateBusDiagramModel } from './bus-diagram-models.domain';
import { busDiagramModelUseCases } from './bus-diagram-models.use-cases';

/**
 * Creates a new bus diagram model and automatically generates seat models in a single transaction.
 * @param params - Data for the new bus diagram model
 * @returns {Promise<BusDiagramModel>} The created bus diagram model
 * @throws {APIError} If creation fails or validation fails
 */
export const createBusDiagramModel = api(
  { expose: true, method: 'POST', path: '/bus-diagram-models/create' },
  async (params: CreateBusDiagramModelPayload): Promise<BusDiagramModel> => {
    await validateBusDiagramModel(params);
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
 * @returns {Promise<ListBusDiagramModelsResult>} An object with a data array of bus diagram models
 * @throws {APIError} If retrieval fails
 */
export const listBusDiagramModels = api(
  { method: 'POST', path: '/bus-diagram-models/list/all', expose: true },
  async (
    params: ListBusDiagramModelsQueryParams,
  ): Promise<ListBusDiagramModelsResult> => {
    const busDiagramModels = await busDiagramModelRepository.findAll(params);
    return {
      data: busDiagramModels,
    };
  },
);

/**
 * Retrieves bus diagram models with pagination (useful for tables).
 * @param params - Pagination and query parameters including page, pageSize, orderBy, filters, and searchTerm
 * @returns {Promise<PaginatedListBusDiagramModelsResult>} Unified paginated response with data and pagination properties
 * @throws {APIError} If retrieval fails
 */
export const listBusDiagramModelsPaginated = api(
  { expose: true, method: 'POST', path: '/bus-diagram-models/list' },
  async (
    params: PaginatedListBusDiagramModelsQueryParams,
  ): Promise<PaginatedListBusDiagramModelsResult> => {
    return await busDiagramModelRepository.findAllPaginated(params);
  },
);

/**
 * Updates an existing bus diagram model and optionally regenerates seat models.
 * @param params - Object containing the bus diagram model ID and update data
 * @param params.id - The ID of the bus diagram model to update
 * @param params.regenerateSeats - Whether to regenerate seat models after update (default: false)
 * @returns {Promise<BusDiagramModel>} The updated bus diagram model
 * @throws {APIError} If update fails, validation fails, or the bus diagram model doesn't exist
 */
export const updateBusDiagramModel = api(
  { expose: true, method: 'PUT', path: '/bus-diagram-models/:id/update' },
  async ({
    id,
    regenerateSeats = false,
    ...data
  }: UpdateBusDiagramModelPayload & {
    id: number;
    regenerateSeats?: boolean;
  }): Promise<BusDiagramModel> => {
    await validateBusDiagramModel(data, id);

    // Update the bus diagram model and optionally regenerate seats
    if (regenerateSeats) {
      // Regenerate seat models with the updated diagram model data in a single transaction
      const result = await busSeatModelUseCases.regenerateSeatModels(id, data);
      return result.busDiagramModel;
    } else {
      // Just update the bus diagram model without regenerating seats
      return await busDiagramModelRepository.update(id, data);
    }
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
  { expose: true, method: 'DELETE', path: '/bus-diagram-models/:id/delete' },
  async ({ id }: { id: number }): Promise<BusDiagramModel> => {
    return await busDiagramModelRepository.delete(id);
  },
);

/**
 * Updates the seat configuration of a template seat layout in a single batch operation.
 * @param params - Object containing the bus diagram model ID and seat configurations
 * @param params.id - The ID of the bus diagram model to update
 * @param params.seats - Array of seat configurations to update/create/deactivate
 * @returns {Promise<UpdatedSeatConfiguration>} Statistics about the update operation and updated seat models
 * @throws {APIError} If the update fails, validation fails, or the bus diagram model doesn't exist
 */
export const updateSeatConfiguration = api(
  { expose: true, method: 'PUT', path: '/bus-diagram-models/:id/seats/update' },
  async ({
    id,
    seats,
  }: {
    id: number;
  } & UpdateSeatConfigurationPayload): Promise<UpdatedSeatConfiguration> => {
    return await busSeatModelUseCases.batchUpdateSeatConfiguration(id, seats);
  },
);

/**
 * Retrieves all seat models for a specific bus diagram model.
 * @param params - Object containing the bus diagram model ID
 * @param params.id - The ID of the bus diagram model to get seats for
 * @returns {Promise<ListBusSeatModelsResult>} Object containing array of seat models
 * @throws {APIError} If retrieval fails or the bus diagram model doesn't exist
 */
export const listBusDiagramModelSeats = api(
  { expose: true, method: 'GET', path: '/bus-diagram-models/:id/seats/list' },
  async ({ id }: { id: number }): Promise<ListBusSeatModelsResult> => {
    return await busDiagramModelUseCases.getBusDiagramModelSeats(id);
  },
);

/**
 * Synchronizes seats from bus diagram model to all non-modified operational diagrams.
 * Finds all seat diagrams that reference this model and haven't been manually modified,
 * then updates their seats to match the current model configuration.
 * @param params - Object containing the bus diagram model ID
 * @param params.id - The ID of the bus diagram model to sync seats from
 * @returns {Promise<RegenerateSeatsResponse>} Summary of changes for each diagram that was synced
 * @throws {APIError} If the sync fails or the bus diagram model doesn't exist
 */
export const regenerateSeats = api(
  {
    expose: true,
    method: 'POST',
    path: '/bus-diagram-models/:id/seats/regenerate',
  },
  async ({ id }: { id: number }): Promise<RegenerateSeatsResponse> => {
    return await busDiagramModelUseCases.regenerateSeats(id);
  },
);
