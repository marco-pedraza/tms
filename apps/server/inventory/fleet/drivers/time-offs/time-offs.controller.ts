import { api } from 'encore.dev/api';
import { APIError } from 'encore.dev/api';
import type {
  CreateDriverTimeOffRepositoryPayload,
  DriverTimeOff,
  ListDriverTimeOffsQueryParams,
  ListDriverTimeOffsResult,
  PaginatedListDriverTimeOffsQueryParams,
  PaginatedListDriverTimeOffsResult,
  UpdateDriverTimeOffRepositoryPayload,
} from './time-offs.types';
import { driverTimeOffRepository } from './time-offs.repository';
import { validateDriverTimeOff } from './time-offs.domain';

/**
 * Creates a new time-off for a driver.
 * @param params - The time-off data to create (includes driverId)
 * @returns {Promise<DriverTimeOff>} The created time-off
 * @throws {APIError} If the time-off creation fails
 */
export const createDriverTimeOff = api(
  { expose: true, method: 'POST', path: '/drivers/:driverId/time-offs/create' },
  async ({
    driverId,
    ...data
  }: CreateDriverTimeOffRepositoryPayload): Promise<DriverTimeOff> => {
    await validateDriverTimeOff(driverId, data);
    const createData = { ...data, driverId };
    return await driverTimeOffRepository.create(createData);
  },
);

/**
 * Retrieves a time-off by its ID for a specific driver.
 * @param params - Object containing the driver ID and time-off ID
 * @returns {Promise<DriverTimeOff>} The found time-off
 * @throws {APIError} If the time-off is not found or doesn't belong to the driver
 */
export const getDriverTimeOff = api(
  { expose: true, method: 'GET', path: '/drivers/:driverId/time-offs/:id' },
  async ({
    driverId,
    id,
  }: {
    driverId: number;
    id: number;
  }): Promise<DriverTimeOff> => {
    const timeOff = await driverTimeOffRepository.findOne(id);

    // Verify the time-off belongs to the specified driver
    if (timeOff.driverId !== driverId) {
      throw APIError.notFound('Time-off not found for this driver');
    }

    return timeOff;
  },
);

/**
 * Retrieves all time-offs for a driver without pagination (useful for dropdowns).
 * @param params - Driver ID and query parameters including orderBy, filters, and searchTerm
 * @returns {Promise<ListDriverTimeOffsResult>} Unified response with data property containing array of time-offs
 * @throws {APIError} If retrieval fails
 */
export const listDriverTimeOffs = api(
  {
    expose: true,
    method: 'POST',
    path: '/drivers/:driverId/time-offs/list/all',
  },
  async ({
    driverId,
    ...params
  }: ListDriverTimeOffsQueryParams & {
    driverId: number;
  }): Promise<ListDriverTimeOffsResult> => {
    // Add driver filter to the params
    const filters = {
      ...(params.filters ?? {}),
      driverId,
    };

    const updatedParams = {
      ...params,
      filters,
    };

    const timeOffs = await driverTimeOffRepository.findAll(updatedParams);

    return {
      data: timeOffs,
    };
  },
);

/**
 * Retrieves time-offs for a driver with pagination (useful for tables).
 * @param params - Driver ID and pagination and query parameters including page, pageSize, orderBy, filters, and searchTerm
 * @returns {Promise<PaginatedListDriverTimeOffsResult>} Unified paginated response with data and pagination properties
 * @throws {APIError} If retrieval fails
 */
export const listDriverTimeOffsPaginated = api(
  { expose: true, method: 'POST', path: '/drivers/:driverId/time-offs/list' },
  async ({
    driverId,
    ...params
  }: PaginatedListDriverTimeOffsQueryParams & {
    driverId: number;
  }): Promise<PaginatedListDriverTimeOffsResult> => {
    // Add driver filter to the params
    const filters = {
      ...params.filters,
      driverId: driverId,
    };

    const updatedParams = {
      ...params,
      filters,
    };

    return await driverTimeOffRepository.findAllPaginated(updatedParams);
  },
);

/**
 * Updates an existing time-off for a driver.
 * @param params - Object containing the time-off ID and update data (includes driverId)
 * @returns {Promise<DriverTimeOff>} The updated time-off
 * @throws {APIError} If the time-off is not found or update fails
 */
export const updateDriverTimeOff = api(
  {
    expose: true,
    method: 'PUT',
    path: '/drivers/:driverId/time-offs/:id/update',
  },
  async ({
    driverId,
    id,
    ...data
  }: UpdateDriverTimeOffRepositoryPayload): Promise<DriverTimeOff> => {
    // First, verify the time-off exists and belongs to the driver
    const existingTimeOff = await driverTimeOffRepository.findOne(id);
    if (existingTimeOff.driverId !== driverId) {
      throw APIError.notFound('Time-off not found for this driver');
    }

    // Validate time-off business rules for update
    await validateDriverTimeOff(driverId, data, id);

    const updateData = { ...data, driverId };

    return await driverTimeOffRepository.update(id, updateData);
  },
);

/**
 * Deletes a time-off by its ID for a specific driver (soft delete).
 * @param params - Object containing the driver ID and time-off ID
 * @returns {Promise<DriverTimeOff>} The deleted time-off
 * @throws {APIError} If the time-off is not found or deletion fails
 */
export const deleteDriverTimeOff = api(
  {
    expose: true,
    method: 'DELETE',
    path: '/drivers/:driverId/time-offs/:id/delete',
  },
  async ({
    driverId,
    id,
  }: {
    driverId: number;
    id: number;
  }): Promise<DriverTimeOff> => {
    // First, verify the time-off exists and belongs to the driver
    const existingTimeOff = await driverTimeOffRepository.findOne(id);
    if (existingTimeOff.driverId !== driverId) {
      throw APIError.notFound('Time-off not found for this driver');
    }

    return await driverTimeOffRepository.delete(id);
  },
);
