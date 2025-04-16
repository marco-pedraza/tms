import { api } from 'encore.dev/api';
import { busRepository } from './buses.repository';
import {
  CreateBusPayload,
  UpdateBusPayload,
  Bus,
  Buses,
  PaginatedBuses,
  BusStatus,
} from './buses.types';
import { PaginationParams } from '../../shared/types';
import { parseApiError } from '../../shared/errors';

/**
 * Creates a new bus.
 * @param params - The bus data to create
 * @returns {Promise<Bus>} The created bus
 * @throws {APIError} If the bus creation fails
 */
export const createBus = api(
  { method: 'POST', path: '/buses', expose: true },
  async (params: CreateBusPayload): Promise<Bus> => {
    try {
      return await busRepository.create(params);
    } catch (error) {
      throw parseApiError(error);
    }
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
    try {
      return await busRepository.findOne(id);
    } catch (error) {
      throw parseApiError(error);
    }
  },
);

/**
 * Retrieves all buses without pagination (useful for dropdowns).
 * @returns {Promise<Buses>} An object containing an array of buses
 * @throws {APIError} If retrieval fails
 */
export const listBuses = api(
  { method: 'GET', path: '/buses', expose: true },
  async (): Promise<Buses> => {
    try {
      return await busRepository.findAll();
    } catch (error) {
      throw parseApiError(error);
    }
  },
);

/**
 * Retrieves buses with pagination (useful for tables).
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedBuses>} Paginated list of buses
 * @throws {APIError} If retrieval fails
 */
export const listBusesPaginated = api(
  { method: 'GET', path: '/buses/paginated', expose: true },
  async (params: PaginationParams): Promise<PaginatedBuses> => {
    try {
      return await busRepository.findAllPaginated(params);
    } catch (error) {
      throw parseApiError(error);
    }
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
    try {
      return await busRepository.update(id, data);
    } catch (error) {
      throw parseApiError(error);
    }
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
    try {
      return await busRepository.delete(id);
    } catch (error) {
      throw parseApiError(error);
    }
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
    try {
      return await busRepository.findByModelId(modelId);
    } catch (error) {
      throw parseApiError(error);
    }
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
    try {
      return await busRepository.findAvailable();
    } catch (error) {
      throw parseApiError(error);
    }
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
    try {
      return await busRepository.findAllByStatus(status as BusStatus);
    } catch (error) {
      throw parseApiError(error);
    }
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
    try {
      return await busRepository.updateStatus(id, status as BusStatus);
    } catch (error) {
      throw parseApiError(error);
    }
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
    try {
      const allowedTransitions =
        await busRepository.getAllowedStatusTransitions(id);
      return { allowedTransitions };
    } catch (error) {
      throw parseApiError(error);
    }
  },
);
