import { api } from 'encore.dev/api';
import type {
  BusLine,
  BusLines,
  BusLinesQueryOptions,
  CreateBusLinePayload,
  PaginatedBusLines,
  PaginationParamsBusLines,
  UpdateBusLinePayload,
} from './bus-lines.types';
import { busLineRepository } from './bus-lines.repository';

/**
 * Creates a new bus line.
 * @param params - The bus line data to create
 * @returns {Promise<BusLine>} The created bus line
 * @throws {APIError} If the bus line creation fails
 */
export const createBusLine = api(
  { expose: true, method: 'POST', path: '/bus-lines' },
  async (params: CreateBusLinePayload): Promise<BusLine> => {
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
 * @returns {Promise<BusLines>} An object containing an array of bus lines
 * @throws {APIError} If retrieval fails
 */
export const listBusLines = api(
  { expose: true, method: 'POST', path: '/get-bus-lines' },
  async (params: BusLinesQueryOptions): Promise<BusLines> => {
    const busLines = await busLineRepository.findAll(params);
    return {
      busLines,
    };
  },
);

/**
 * Retrieves bus lines with pagination (useful for tables).
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedBusLines>} Paginated list of bus lines
 * @throws {APIError} If retrieval fails
 */
export const listBusLinesPaginated = api(
  { expose: true, method: 'POST', path: '/get-bus-lines/paginated' },
  async (params: PaginationParamsBusLines): Promise<PaginatedBusLines> => {
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
  { expose: true, method: 'PUT', path: '/bus-lines/:id' },
  async ({
    id,
    ...data
  }: UpdateBusLinePayload & { id: number }): Promise<BusLine> => {
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
  { expose: true, method: 'DELETE', path: '/bus-lines/:id' },
  async ({ id }: { id: number }): Promise<BusLine> => {
    return await busLineRepository.delete(id);
  },
);

/**
 * Searches for bus lines by matching a search term against name and code.
 * @param params - Search parameters
 * @param params.term - The search term to match against bus line name and code
 * @returns {Promise<BusLines>} List of matching bus lines
 * @throws {APIError} If search fails or no searchable fields are configured
 */
export const searchBusLines = api(
  { expose: true, method: 'GET', path: '/bus-lines/search' },
  async ({ term }: { term: string }): Promise<BusLines> => {
    const busLines = await busLineRepository.search(term);
    return {
      busLines,
    };
  },
);

/**
 * Searches for bus lines with pagination by matching a search term against name and code.
 * @param params - Search and pagination parameters
 * @param params.term - The search term to match against bus line name and code
 * @param params.page - Page number for pagination (optional, default: 1)
 * @param params.pageSize - Number of items per page (optional, default: 10)
 * @param params.orderBy - Sorting criteria (optional)
 * @param params.filters - Additional filters to apply (optional)
 * @returns {Promise<PaginatedBusLines>} Paginated list of matching bus lines
 * @throws {APIError} If search fails or no searchable fields are configured
 */
export const searchBusLinesPaginated = api(
  { expose: true, method: 'POST', path: '/bus-lines/search/paginated' },
  async ({
    term,
    ...params
  }: PaginationParamsBusLines & {
    term: string;
  }): Promise<PaginatedBusLines> => {
    return await busLineRepository.searchPaginated(term, params);
  },
);
