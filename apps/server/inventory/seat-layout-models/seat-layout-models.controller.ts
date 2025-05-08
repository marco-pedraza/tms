import { api } from 'encore.dev/api';
import {
  SeatLayoutModel,
  CreateSeatLayoutModelPayload,
  UpdateSeatLayoutModelPayload,
  SeatLayoutModels,
  PaginatedSeatLayoutModels,
} from './seat-layout-models.types';
import { seatLayoutModelRepository } from './seat-layout-models.repository';
import { PaginationParams } from '../../shared/types';

/**
 * Creates a new seat layout model.
 * @param params - Data for the new seat layout model
 * @returns {Promise<SeatLayoutModel>} The created seat layout model
 * @throws {APIError} If creation fails or validation fails
 */
export const createSeatLayoutModel = api(
  { expose: true, method: 'POST', path: '/seat-layout-models' },
  async (params: CreateSeatLayoutModelPayload): Promise<SeatLayoutModel> => {
    return await seatLayoutModelRepository.create(params);
  },
);

/**
 * Retrieves a seat layout model by its ID.
 * @param params - Object containing the seat layout model ID
 * @param params.id - The ID of the seat layout model to retrieve
 * @returns {Promise<SeatLayoutModel>} The requested seat layout model
 * @throws {APIError} If retrieval fails or the seat layout model doesn't exist
 */
export const getSeatLayoutModel = api(
  { expose: true, method: 'GET', path: '/seat-layout-models/:id' },
  async ({ id }: { id: number }): Promise<SeatLayoutModel> => {
    return await seatLayoutModelRepository.findOne(id);
  },
);

/**
 * Retrieves all seat layout models without pagination (useful for dropdowns).
 * @returns {Promise<SeatLayoutModels>} List of all seat layout models
 * @throws {APIError} If retrieval fails
 */
export const listSeatLayoutModels = api(
  { expose: true, method: 'POST', path: '/get-seat-layout-models' },
  async (): Promise<SeatLayoutModels> => {
    const { seatLayoutModels: models } =
      await seatLayoutModelRepository.findAll();
    return {
      seatLayoutModels: models,
    };
  },
);

/**
 * Retrieves seat layout models with pagination (useful for tables).
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedSeatLayoutModels>} Paginated list of seat layout models
 * @throws {APIError} If retrieval fails
 */
export const listSeatLayoutModelsPaginated = api(
  { expose: true, method: 'POST', path: '/get-seat-layout-models/paginated' },
  async (params: PaginationParams): Promise<PaginatedSeatLayoutModels> => {
    return await seatLayoutModelRepository.findAllPaginated(params);
  },
);

/**
 * Updates an existing seat layout model.
 * @param params - Object containing the seat layout model ID and update data
 * @param params.id - The ID of the seat layout model to update
 * @param params.data - The seat layout model data to update
 * @returns {Promise<SeatLayoutModel>} The updated seat layout model
 * @throws {APIError} If update fails, validation fails, or the seat layout model doesn't exist
 */
export const updateSeatLayoutModel = api(
  { expose: true, method: 'PATCH', path: '/seat-layout-models/:id' },
  async ({
    id,
    ...data
  }: UpdateSeatLayoutModelPayload & {
    id: number;
  }): Promise<SeatLayoutModel> => {
    return await seatLayoutModelRepository.update(id, data);
  },
);

/**
 * Deletes a seat layout model by its ID.
 * @param params - Object containing the seat layout model ID
 * @param params.id - The ID of the seat layout model to delete
 * @returns {Promise<SeatLayoutModel>} The deleted seat layout model
 * @throws {APIError} If deletion fails or the seat layout model doesn't exist
 */
export const deleteSeatLayoutModel = api(
  { expose: true, method: 'DELETE', path: '/seat-layout-models/:id' },
  async ({ id }: { id: number }): Promise<SeatLayoutModel> => {
    return await seatLayoutModelRepository.delete(id);
  },
);
