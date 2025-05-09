import { api } from 'encore.dev/api';
import { busRepository } from './buses.repository';
import {
  CreateBusPayload,
  UpdateBusPayload,
  Bus,
  Buses,
  PaginatedBuses,
  BusStatus,
  BusesQueryOptions,
  PaginationParamsBuses,
} from './buses.types';
import { createBusWithSeatDiagram } from './buses.use-cases';

/**
 * Creates a new bus.
 * @param params - The bus data to create
 * @returns {Promise<Bus>} The created bus
 * @throws {APIError} If the bus creation fails
 */
export const createBus = api(
  { method: 'POST', path: '/buses', expose: true },
  async (params: CreateBusPayload): Promise<Bus> => {
    return await createBusWithSeatDiagram(params);
  },
);

/**
 * Retrieves a bus by its ID.
 * @param params - Object containing the bus ID
 * @param params.id - The ID of the bus to retrieve
 * @returns {Promise<Bus>} The found bus
 * @throws {APIError} If the bus is not found or retrieval fails
 */
export const getBus = api(
  { method: 'GET', path: '/buses/:id', expose: true },
  async ({ id }: { id: number }): Promise<Bus> => {
    return await busRepository.findOne(id);
  },
);

/**
 * Retrieves all buses without pagination (useful for dropdowns).
 * @param params - Query options for ordering and filtering
 * @returns {Promise<Buses>} An object containing an array of buses
 * @throws {APIError} If retrieval fails
 */
export const listBuses = api(
  { method: 'POST', path: '/get-buses', expose: true },
  async (params?: BusesQueryOptions): Promise<Buses> => {
    return await busRepository.findAll(params || {});
  },
);

/**
 * Retrieves buses with pagination (useful for tables).
 * @param params - Pagination parameters with query options
 * @returns {Promise<PaginatedBuses>} Paginated list of buses
 * @throws {APIError} If retrieval fails
 */
export const listBusesPaginated = api(
  { method: 'POST', path: '/get-buses/paginated', expose: true },
  async (params?: PaginationParamsBuses): Promise<PaginatedBuses> => {
    return await busRepository.findAllPaginated(params || {});
  },
);

/**
 * Updates an existing bus.
 * @param params - Object containing the bus ID and update data
 * @param params.id - The ID of the bus to update
 * @param params.data - The bus data to update
 * @returns {Promise<Bus>} The updated bus
 * @throws {APIError} If the bus is not found or update fails
 */
export const updateBus = api(
  { method: 'PUT', path: '/buses/:id', expose: true },
  async ({ id, ...data }: UpdateBusPayload & { id: number }): Promise<Bus> => {
    return await busRepository.update(id, data);
  },
);

/**
 * Deletes a bus by its ID.
 * @param params - Object containing the bus ID
 * @param params.id - The ID of the bus to delete
 * @returns {Promise<Bus>} The deleted bus
 * @throws {APIError} If the bus is not found or deletion fails
 */
export const deleteBus = api(
  { method: 'DELETE', path: '/buses/:id', expose: true },
  async ({ id }: { id: number }): Promise<Bus> => {
    return await busRepository.delete(id);
  },
);

/**
 * Retrieves buses by model ID.
 * @param params - Object containing the model ID
 * @param params.modelId - The ID of the bus model
 * @returns {Promise<Buses>} An object containing an array of buses
 * @throws {APIError} If retrieval fails
 */
export const getBusesByModel = api(
  { method: 'GET', path: '/buses/by-model/:modelId', expose: true },
  async ({ modelId }: { modelId: number }): Promise<Buses> => {
    return await busRepository.findByModelId(modelId);
  },
);

/**
 * Retrieves buses that are available for use.
 * @returns {Promise<Buses>} An object containing an array of available buses
 * @throws {APIError} If retrieval fails
 */
export const getAvailableBuses = api(
  { method: 'GET', path: '/buses/available', expose: true },
  async (): Promise<Buses> => {
    return await busRepository.findAvailable();
  },
);

/**
 * Retrieves buses by status.
 * @param params - Object containing the status
 * @param params.status - The status to filter by
 * @returns {Promise<Buses>} An object containing an array of buses
 * @throws {APIError} If retrieval fails
 */
export const getBusesByStatus = api(
  { method: 'GET', path: '/buses/by-status/:status', expose: true },
  async ({ status }: { status: string }): Promise<Buses> => {
    return await busRepository.findAllByStatus(status as BusStatus);
  },
);

/**
 * Updates a bus status.
 * @param params - Object containing the bus ID and status
 * @param params.id - The ID of the bus
 * @param params.status - The new status
 * @returns {Promise<Bus>} The updated bus
 * @throws {APIError} If the status update fails
 */
export const updateBusStatus = api(
  { method: 'PUT', path: '/buses/:id/status', expose: true },
  async ({ id, status }: { id: number; status: string }): Promise<Bus> => {
    return await busRepository.updateStatus(id, status as BusStatus);
  },
);

/**
 * Gets all allowed status transitions for a bus.
 * @param params - Object containing the bus ID
 * @param params.id - The ID of the bus
 * @returns {Promise<{ allowedTransitions: BusStatus[] }>} An object containing allowed transitions
 * @throws {APIError} If retrieval fails
 */
export const getAllowedBusStatusTransitions = api(
  {
    method: 'GET',
    path: '/buses/:id/allowed-status-transitions',
    expose: true,
  },
  async ({
    id,
  }: {
    id: number;
  }): Promise<{ allowedTransitions: BusStatus[] }> => {
    const allowedTransitions =
      await busRepository.getAllowedStatusTransitions(id);
    return { allowedTransitions };
  },
);

/**
 * Searches for buses by matching a search term against registration number, economic number, and vehicle ID.
 * @param params - Search parameters
 * @param params.term - The search term to match
 * @returns {Promise<Buses>} List of matching buses
 * @throws {APIError} If search fails or no searchable fields are configured
 */
export const searchBuses = api(
  { method: 'GET', path: '/buses/search', expose: true },
  async ({ term }: { term: string }): Promise<Buses> => {
    const buses = await busRepository.search(term);
    return {
      buses,
    };
  },
);

/**
 * Searches for buses with pagination by matching a search term.
 * @param params - Search and pagination parameters
 * @param params.term - The search term to match
 * @param params.page - Page number for pagination (optional, default: 1)
 * @param params.pageSize - Number of items per page (optional, default: 10)
 * @param params.orderBy - Sorting criteria (optional)
 * @param params.filters - Additional filters to apply (optional)
 * @returns {Promise<PaginatedBuses>} Paginated list of matching buses
 * @throws {APIError} If search fails or no searchable fields are configured
 */
export const searchBusesPaginated = api(
  { method: 'POST', path: '/buses/search/paginated', expose: true },
  async ({
    term,
    ...params
  }: PaginationParamsBuses & {
    term: string;
  }): Promise<PaginatedBuses> => {
    return await busRepository.searchPaginated(term, params);
  },
);
