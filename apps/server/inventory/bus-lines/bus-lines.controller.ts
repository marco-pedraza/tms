import { api } from 'encore.dev/api';
import { busLineRepository } from './bus-lines.repository';
import type {
  BusLine,
  PaginatedBusLines,
  BusLines,
  CreateBusLinePayload,
  UpdateBusLinePayload,
} from './bus-lines.types';
import { PaginationParams } from '../../shared/types';

/**
 * Creates a new bus line
 * @param payload - Bus line data to create
 * @returns The newly created bus line
 */
export const createBusLine = api(
  {
    method: 'POST',
    path: '/bus-lines',
  },
  async (payload: CreateBusLinePayload): Promise<BusLine> => {
    return await busLineRepository.create(payload);
  },
);

/**
 * Gets a bus line by ID
 * @param params - Object containing the bus line ID
 * @returns The requested bus line
 */
export const getBusLine = api(
  {
    method: 'GET',
    path: '/bus-lines/:id',
  },
  async ({ id }: { id: number }): Promise<BusLine> => {
    return await busLineRepository.findOne(id);
  },
);

/**
 * List bus lines
 * @returns List of bus lines
 */
export const listBusLines = api(
  {
    method: 'GET',
    path: '/bus-lines',
  },
  async (): Promise<BusLines> => {
    const busLines = await busLineRepository.findAll();
    return { busLines };
  },
);

/**
 * List bus lines with pagination
 * @param params - Pagination parameters
 * @returns Paginated list of bus lines
 */
export const listBusLinesPaginated = api(
  {
    method: 'GET',
    path: '/bus-lines/paginated',
  },
  async (params: PaginationParams): Promise<PaginatedBusLines> => {
    return await busLineRepository.findAllPaginated(params);
  },
);

/**
 * Updates an existing bus line
 * @param params - Object containing ID and update data
 * @returns The updated bus line
 */
export const updateBusLine = api(
  {
    method: 'PUT',
    path: '/bus-lines/:id',
  },
  async ({
    id,
    ...payload
  }: { id: number } & UpdateBusLinePayload): Promise<BusLine> => {
    return await busLineRepository.update(id, payload);
  },
);

/**
 * Deletes a bus line
 * @param params - Object containing the bus line ID to delete
 * @returns The deleted bus line
 */
export const deleteBusLine = api(
  {
    method: 'DELETE',
    path: '/bus-lines/:id',
  },
  async ({ id }: { id: number }): Promise<BusLine> => {
    return await busLineRepository.delete(id);
  },
);
