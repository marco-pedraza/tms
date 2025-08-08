import { api } from 'encore.dev/api';
import type {
  BusLine,
  CreateBusLinePayload,
  ListBusLinesQueryParams,
  ListBusLinesResult,
  PaginatedListBusLinesQueryParams,
  PaginatedListBusLinesResult,
  UpdateBusLinePayload,
} from './bus-lines.types';
import { busLineRepository } from './bus-lines.repository';
import { validateBusLine } from './bus-lines.domain';

/**
 * Creates a new bus line.
 * @param params - The bus line data to create
 * @returns {Promise<BusLine>} The created bus line
 * @throws {APIError} If the bus line creation fails
 */
export const createBusLine = api(
  { expose: true, method: 'POST', path: '/bus-lines/create' },
  async (params: CreateBusLinePayload): Promise<BusLine> => {
    await validateBusLine(params);
    return await busLineRepository.create(params);
  },
);

/**
 * Retrieves a bus line by its ID.
 * @param params - Object containing the bus line ID
 * @param params.id - The ID of the bus line to retrieve
 * @returns {Promise<BusLine>} The found bus line
 * @throws {APIError} If the bus line is not found or retrieval fails
 */
export const getBusLine = api(
  { expose: true, method: 'GET', path: '/bus-lines/:id' },
  async ({ id }: { id: number }): Promise<BusLine> => {
    return await busLineRepository.findOne(id);
  },
);

/**
 * Retrieves all bus lines without pagination (useful for dropdowns).
 * @param params - Query parameters including orderBy, filters, and searchTerm
 * @returns {Promise<ListBusLinesResult>} Unified response with data property containing array of bus lines
 * @throws {APIError} If retrieval fails
 */
export const listBusLines = api(
  { expose: true, method: 'POST', path: '/bus-lines/list/all' },
  async (params: ListBusLinesQueryParams): Promise<ListBusLinesResult> => {
    const busLines = await busLineRepository.findAll(params);
    return {
      data: busLines,
    };
  },
);

/**
 * Retrieves bus lines with pagination (useful for tables).
 * @param params - Pagination and query parameters including page, pageSize, orderBy, filters, and searchTerm
 * @returns {Promise<PaginatedListBusLinesResult>} Unified paginated response with data and pagination properties
 * @throws {APIError} If retrieval fails
 */
export const listBusLinesPaginated = api(
  { expose: true, method: 'POST', path: '/bus-lines/list' },
  async (
    params: PaginatedListBusLinesQueryParams,
  ): Promise<PaginatedListBusLinesResult> => {
    return await busLineRepository.findAllPaginated(params);
  },
);

/**
 * Updates an existing bus line.
 * @param params - Object containing the bus line ID and update data
 * @param params.id - The ID of the bus line to update
 * @returns {Promise<BusLine>} The updated bus line
 * @throws {APIError} If the bus line is not found or update fails
 */
export const updateBusLine = api(
  { expose: true, method: 'PUT', path: '/bus-lines/:id/update' },
  async ({
    id,
    ...data
  }: UpdateBusLinePayload & { id: number }): Promise<BusLine> => {
    await validateBusLine(data, id);
    return await busLineRepository.update(id, data);
  },
);

/**
 * Deletes a bus line by its ID.
 * @param params - Object containing the bus line ID
 * @param params.id - The ID of the bus line to delete
 * @returns {Promise<BusLine>} The deleted bus line
 * @throws {APIError} If the bus line is not found or deletion fails
 */
export const deleteBusLine = api(
  { expose: true, method: 'DELETE', path: '/bus-lines/:id/delete' },
  async ({ id }: { id: number }): Promise<BusLine> => {
    return await busLineRepository.delete(id);
  },
);
