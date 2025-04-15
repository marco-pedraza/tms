import { api } from 'encore.dev/api';
import { driverRepository } from './drivers.repository';
import { driverUseCases } from './drivers.use-cases';
import {
  CreateDriverPayload,
  UpdateDriverPayload,
  Driver,
  Drivers,
  PaginatedDrivers,
  DriverStatus,
  PossibleDriverStatuses,
} from './drivers.types';
import { PaginationParams } from '../../shared/types';

/**
 * Creates a new driver.
 * @param params - The driver data to create
 * @returns {Promise<Driver>} The created driver
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
 * @param params - Object containing the driver ID
 * @param params.id - The ID of the driver to retrieve
 * @returns {Promise<Driver>} The found driver
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
 * @returns {Promise<Drivers>} An object containing an array of drivers
 * @throws {APIError} If retrieval fails
 */
export const listDrivers = api(
  { method: 'GET', path: '/drivers' },
  async (): Promise<Drivers> => {
    return await driverRepository.findAll();
  },
);

/**
 * Retrieves drivers with pagination (useful for tables).
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedDrivers>} Paginated list of drivers
 * @throws {APIError} If retrieval fails
 */
export const listDriversPaginated = api(
  { expose: true, method: 'GET', path: '/drivers/paginated' },
  async (params: PaginationParams): Promise<PaginatedDrivers> => {
    return await driverRepository.findAllPaginated(params);
  },
);

/**
 * Updates an existing driver.
 * @param params - Object containing the driver ID and update data
 * @param params.id - The ID of the driver to update
 * @param params.data - The driver data to update
 * @returns {Promise<Driver>} The updated driver
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
 * Updates a driver's status using state machine validation
 * @param params - Object containing the driver ID and new status
 * @param params.id - The ID of the driver to update
 * @param params.status - The new status to set
 * @returns {Promise<Driver>} The updated driver
 * @throws {APIError} If the status transition is invalid or update fails
 */
export const updateDriverStatus = api(
  { expose: true, method: 'PUT', path: '/drivers/:id/status' },
  async ({ id, status }: { id: number; status: string }): Promise<Driver> => {
    return await driverRepository.updateStatus(id, status as DriverStatus);
  },
);

/**
 * Gets all possible next statuses for a driver
 * @param params - Object containing the driver ID
 * @param params.id - The ID of the driver
 * @returns {Promise<PossibleDriverStatuses>} Object containing array of possible next statuses
 * @throws {APIError} If the driver is not found
 */
export const getDriverPossibleStatuses = api(
  { expose: true, method: 'GET', path: '/drivers/:id/possible-statuses' },
  async ({ id }: { id: number }): Promise<PossibleDriverStatuses> => {
    const statuses = await driverRepository.getPossibleNextStatuses(id);
    return { statuses };
  },
);

/**
 * List drivers by status
 * @param params - Object containing the status to filter by
 * @param params.status - The status to filter by
 * @returns {Promise<Drivers>} Drivers with the specified status
 * @throws {APIError} If retrieval fails
 */
export const listDriversByStatus = api(
  { expose: true, method: 'GET', path: '/drivers/by-status/:status' },
  async ({ status }: { status: string }): Promise<Drivers> => {
    return await driverRepository.findAllByStatus(status as DriverStatus);
  },
);

/**
 * List drivers by transporter
 * @param params - Object containing the transporter ID to filter by
 * @param params.transporterId - The transporter ID to filter by
 * @returns {Promise<Drivers>} Drivers associated with the specified transporter
 * @throws {APIError} If retrieval fails
 */
export const listDriversByTransporter = api(
  {
    expose: true,
    method: 'GET',
    path: '/drivers/by-transporter/:transporterId',
  },
  async ({ transporterId }: { transporterId: number }): Promise<Drivers> => {
    return await driverRepository.findAllByTransporter(transporterId);
  },
);

/**
 * List drivers by bus line
 * @param params - Object containing the bus line ID to filter by
 * @param params.busLineId - The bus line ID to filter by
 * @returns {Promise<Drivers>} Drivers associated with the specified bus line
 * @throws {APIError} If retrieval fails
 */
export const listDriversByBusLine = api(
  { expose: true, method: 'GET', path: '/drivers/by-bus-line/:busLineId' },
  async ({ busLineId }: { busLineId: number }): Promise<Drivers> => {
    return await driverRepository.findAllByBusLine(busLineId);
  },
);

/**
 * Assigns a driver to a transporter
 * @param params - Object containing the driver ID and transporter ID
 * @param params.id - The ID of the driver
 * @param params.transporterId - The ID of the transporter
 * @returns {Promise<Driver>} The updated driver
 * @throws {APIError} If the assignment fails
 */
export const assignDriverToTransporter = api(
  { expose: true, method: 'POST', path: '/drivers/:id/transporter' },
  async ({
    id,
    transporterId,
  }: {
    id: number;
    transporterId: number;
  }): Promise<Driver> => {
    return await driverUseCases.assignToTransporter(id, transporterId);
  },
);

/**
 * Assigns a driver to a bus line
 * @param params - Object containing the driver ID and bus line ID
 * @param params.id - The ID of the driver
 * @param params.busLineId - The ID of the bus line
 * @returns {Promise<Driver>} The updated driver
 * @throws {APIError} If the assignment fails
 */
export const assignDriverToBusLine = api(
  { expose: true, method: 'POST', path: '/drivers/:id/bus-line' },
  async ({
    id,
    busLineId,
  }: {
    id: number;
    busLineId: number;
  }): Promise<Driver> => {
    return await driverUseCases.assignToBusLine(id, busLineId);
  },
);

/**
 * Removes a driver from a transporter
 * @param params - Object containing the driver ID
 * @param params.id - The ID of the driver
 * @returns {Promise<Driver>} The updated driver
 * @throws {APIError} If the removal fails
 */
export const removeDriverFromTransporter = api(
  { expose: true, method: 'DELETE', path: '/drivers/:id/transporter' },
  async ({ id }: { id: number }): Promise<Driver> => {
    return await driverUseCases.removeFromTransporter(id);
  },
);

/**
 * Removes a driver from a bus line
 * @param params - Object containing the driver ID
 * @param params.id - The ID of the driver
 * @returns {Promise<Driver>} The updated driver
 * @throws {APIError} If the removal fails
 */
export const removeDriverFromBusLine = api(
  { expose: true, method: 'DELETE', path: '/drivers/:id/bus-line' },
  async ({ id }: { id: number }): Promise<Driver> => {
    return await driverUseCases.removeFromBusLine(id);
  },
);
