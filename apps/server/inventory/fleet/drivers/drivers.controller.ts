import { api } from 'encore.dev/api';
import {
  CreateDriverPayload,
  Driver,
  ListDriversQueryParams,
  ListDriversResult,
  ListStatusesResult,
  PaginatedListDriversQueryParams,
  PaginatedListDriversResult,
  UpdateDriverPayload,
} from './drivers.types';
import { driverRepository } from './drivers.repository';

/**
 * Creates a new driver.
 * @throws {APIError} If the driver creation fails
 */
export const createDriver = api(
  { expose: true, method: 'POST', path: '/drivers' },
  async (params: CreateDriverPayload): Promise<Driver> => {
    return await driverRepository.create(params);
  },
);

/**
 * Retrieves a driver by its ID.
 * @throws {APIError} If the driver is not found or retrieval fails
 */
export const getDriver = api(
  { expose: true, method: 'GET', path: '/drivers/:id' },
  async ({ id }: { id: number }): Promise<Driver> => {
    return await driverRepository.findOne(id);
  },
);

/**
 * Retrieves all drivers without pagination (useful for dropdowns).
 * @throws {APIError} If retrieval fails
 */
export const listDrivers = api(
  { expose: true, method: 'POST', path: '/drivers/list' },
  async (params: ListDriversQueryParams): Promise<ListDriversResult> => {
    const drivers = params.searchTerm
      ? await driverRepository.search(params.searchTerm)
      : await driverRepository.findAll(params);
    return {
      data: drivers,
    };
  },
);

/**
 * Retrieves drivers with pagination (useful for tables).
 * @throws {APIError} If retrieval fails
 */
export const listDriversPaginated = api(
  { expose: true, method: 'POST', path: '/drivers/list/paginated' },
  async (
    params: PaginatedListDriversQueryParams,
  ): Promise<PaginatedListDriversResult> => {
    const drivers = params.searchTerm
      ? await driverRepository.searchPaginated(params.searchTerm, params)
      : await driverRepository.findAllPaginated(params);
    return await driverRepository.appendRelations(
      drivers.data,
      drivers.pagination,
      params,
    );
  },
);

/**
 * Updates an existing driver.
 * @throws {APIError} If the driver is not found or update fails
 */
export const updateDriver = api(
  { expose: true, method: 'PUT', path: '/drivers/:id' },
  async ({
    id,
    ...data
  }: UpdateDriverPayload & { id: number }): Promise<Driver> => {
    return await driverRepository.update(id, data);
  },
);

/**
 * Deletes a driver by its ID.
 * @param params - Object containing the driver ID
 * @param params.id - The ID of the driver to delete
 * @returns {Promise<Driver>} The deleted driver
 * @throws {APIError} If the driver is not found or deletion fails
 */
export const deleteDriver = api(
  { expose: true, method: 'DELETE', path: '/drivers/:id' },
  async ({ id }: { id: number }): Promise<Driver> => {
    return await driverRepository.delete(id);
  },
);

/**
 * Gets all valid next statuses for a driver
 * @throws {APIError} If the driver is not found
 */
export const listDriverValidNextStatuses = api(
  { expose: true, method: 'GET', path: '/drivers/:id/valid-next-statuses' },
  async ({ id }: { id: number }): Promise<ListStatusesResult> => {
    const statuses = await driverRepository.getDriverValidNextStatuses(id);
    return { data: statuses };
  },
);

/**
 * Gets all valid initial statuses for a driver
 */
export const listValidInitialStatuses = api(
  {
    expose: true,
    method: 'GET',
    path: '/drivers/valid-initial-statuses/list',
  },
  (): ListStatusesResult => {
    const statuses = driverRepository.getValidInitialStatuses();
    return { data: statuses };
  },
);
