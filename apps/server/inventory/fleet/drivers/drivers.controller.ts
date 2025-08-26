import { api } from 'encore.dev/api';
import type {
  CreateDriverPayload,
  DriverWithRelations,
  ListDriversQueryParams,
  ListDriversResult,
  PaginatedListDriversQueryParams,
  PaginatedListDriversResult,
  UpdateDriverPayload,
} from './drivers.types';
import { driverRepository } from './drivers.repository';
import { validateDriver } from './drivers.domain';
import { driverUseCases } from './drivers.use-cases';

/**
 * Creates a new driver.
 * @param params - The driver data to create
 * @returns {Promise<DriverWithRelations>} The created driver with transporter and bus line information
 * @throws {APIError} If the driver creation fails
 */
export const createDriver = api(
  { expose: true, method: 'POST', path: '/drivers/create' },
  async (params: CreateDriverPayload): Promise<DriverWithRelations> => {
    await validateDriver(params);
    return await driverUseCases.createDriverWithTransporter(params);
  },
);

/**
 * Retrieves a driver by its ID.
 * @param params - Object containing the driver ID
 * @param params.id - The ID of the driver to retrieve
 * @returns {Promise<DriverWithRelations>} The found driver
 * @throws {APIError} If the driver is not found or retrieval fails
 */
export const getDriver = api(
  { expose: true, method: 'GET', path: '/drivers/:id' },
  async ({ id }: { id: number }): Promise<DriverWithRelations> => {
    return await driverRepository.findOneWithRelations(id);
  },
);

/**
 * Retrieves all drivers without pagination (useful for dropdowns).
 * @param params - Query parameters including orderBy, filters, and searchTerm
 * @returns {Promise<ListDriversResult>} Unified response with data property containing array of drivers
 * @throws {APIError} If retrieval fails
 */
export const listDrivers = api(
  { expose: true, method: 'POST', path: '/drivers/list/all' },
  async (params: ListDriversQueryParams): Promise<ListDriversResult> => {
    const drivers = await driverRepository.findAll(params);
    return {
      data: drivers,
    };
  },
);

/**
 * Retrieves drivers with pagination (useful for tables).
 * @param params - Pagination and query parameters including page, pageSize, orderBy, filters, and searchTerm
 * @returns {Promise<PaginatedListDriversResult>} Unified paginated response with data and pagination properties
 * @throws {APIError} If retrieval fails
 */
export const listDriversPaginated = api(
  { expose: true, method: 'POST', path: '/drivers/list' },
  async (
    params: PaginatedListDriversQueryParams,
  ): Promise<PaginatedListDriversResult> => {
    const result = await driverRepository.findAllPaginated(params);

    return await driverRepository.appendRelations(
      result.data,
      result.pagination,
      params,
    );
  },
);

/**
 * Updates an existing driver.
 * @param params - Object containing the driver ID and update data
 * @param params.id - The ID of the driver to update
 * @returns {Promise<DriverWithRelations>} The updated driver with transporter and bus line information
 * @throws {APIError} If the driver is not found or update fails
 */
export const updateDriver = api(
  { expose: true, method: 'PUT', path: '/drivers/:id/update' },
  async ({
    id,
    ...data
  }: UpdateDriverPayload & { id: number }): Promise<DriverWithRelations> => {
    await validateDriver(data, id);
    return await driverUseCases.updateDriverWithTransporter(id, data);
  },
);

/**
 * Deletes a driver by its ID.
 * @param params - Object containing the driver ID
 * @param params.id - The ID of the driver to delete
 * @returns {Promise<DriverWithRelations>} The deleted driver
 * @throws {APIError} If the driver is not found or deletion fails
 */
export const deleteDriver = api(
  { expose: true, method: 'DELETE', path: '/drivers/:id/delete' },
  async ({ id }: { id: number }): Promise<DriverWithRelations> => {
    const driver = await driverRepository.findOneWithRelations(id);
    await driverRepository.delete(id);
    return driver;
  },
);
