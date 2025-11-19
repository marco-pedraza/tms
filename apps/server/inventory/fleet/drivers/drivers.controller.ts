import { api } from 'encore.dev/api';
import { APIError } from 'encore.dev/api';
import type {
  CreateDriverPayload,
  DriverWithRelations,
  ListDriversAvailabilityQueryParams,
  ListDriversAvailabilityResult,
  ListDriversQueryParams,
  ListDriversResult,
  PaginatedListDriversQueryParams,
  PaginatedListDriversResult,
  UpdateDriverPayload,
} from './drivers.types';
import type {
  CreateDriverMedicalCheckEndpointPayload,
  DriverMedicalCheck,
  ListDriverMedicalChecksQueryParams,
  ListDriverMedicalChecksResult,
  PaginatedListDriverMedicalChecksQueryParams,
  PaginatedListDriverMedicalChecksResult,
} from './medical-checks/medical-checks.types';
import type {
  CreateDriverTimeOffEndpointPayload,
  DriverTimeOff,
  ListDriverTimeOffsQueryParams,
  ListDriverTimeOffsResult,
  PaginatedListDriverTimeOffsQueryParams,
  PaginatedListDriverTimeOffsResult,
  UpdateDriverTimeOffPayload,
} from './time-offs/time-offs.types';
import { driverRepository } from './drivers.repository';
import { driverMedicalCheckRepository } from './medical-checks/medical-checks.repository';
import { driverTimeOffRepository } from './time-offs/time-offs.repository';
import { driverApplicationService } from './drivers.application-service';

/**
 * Creates a new driver.
 * @param params - The driver data to create
 * @returns {Promise<DriverWithRelations>} The created driver with transporter and bus line information
 * @throws {APIError} If the driver creation fails
 */
export const createDriver = api(
  {
    expose: true,
    method: 'POST',
    path: '/drivers/create',
    auth: true,
  },
  async (params: CreateDriverPayload): Promise<DriverWithRelations> => {
    return await driverApplicationService.createDriver(params);
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
  {
    expose: true,
    method: 'GET',
    path: '/drivers/:id',
    auth: true,
  },
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
  {
    expose: true,
    method: 'POST',
    path: '/drivers/list/all',
    auth: true,
  },
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
  {
    expose: true,
    method: 'POST',
    path: '/drivers/list',
    auth: true,
  },
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
  {
    expose: true,
    method: 'PUT',
    path: '/drivers/:id/update',
    auth: true,
  },
  async ({
    id,
    ...data
  }: UpdateDriverPayload & { id: number }): Promise<DriverWithRelations> => {
    return await driverApplicationService.updateDriver(id, data);
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
  {
    expose: true,
    method: 'DELETE',
    path: '/drivers/:id/delete',
    auth: true,
  },
  async ({ id }: { id: number }): Promise<DriverWithRelations> => {
    return await driverApplicationService.deleteDriver(id);
  },
);

/**
 * Retrieves the availability of drivers for a given date range with filtering and ordering support.
 * @param params - Query parameters including startDate, endDate, orderBy, filters, and searchTerm
 * @returns {Promise<GetDriversAvailabilityResult>} Unified response with data property containing array of drivers and their availability
 * @throws {APIError} If retrieval fails
 */
export const listDriversAvailability = api(
  {
    expose: true,
    method: 'POST',
    path: '/drivers/availability',
    auth: true,
  },
  async (
    params: ListDriversAvailabilityQueryParams,
  ): Promise<ListDriversAvailabilityResult> => {
    return await driverApplicationService.getDriversAvailability(params);
  },
);

/**
 * Creates a new medical check for a driver.
 * @param params - The medical check data to create (includes driverId)
 * @returns {Promise<DriverMedicalCheck>} The created medical check
 * @throws {APIError} If the medical check creation fails
 */
export const createDriverMedicalCheck = api(
  {
    expose: true,
    method: 'POST',
    path: '/drivers/:driverId/medical-checks/create',
    auth: true,
  },
  async (
    params: CreateDriverMedicalCheckEndpointPayload,
  ): Promise<DriverMedicalCheck> => {
    const { driverId, ...data } = params;
    return await driverApplicationService.createMedicalCheck(driverId, data);
  },
);

/**
 * Creates a new time-off for a driver.
 * @param params - The time-off data to create (includes driverId)
 * @returns {Promise<DriverTimeOff>} The created time-off
 * @throws {APIError} If the time-off creation fails
 */
export const createDriverTimeOff = api(
  {
    expose: true,
    method: 'POST',
    path: '/drivers/:driverId/time-offs/create',
    auth: true,
  },
  async (
    params: CreateDriverTimeOffEndpointPayload,
  ): Promise<DriverTimeOff> => {
    const { driverId, ...data } = params;
    return await driverApplicationService.createTimeOff(driverId, data);
  },
);

/**
 * Updates an existing time-off for a driver.
 * @param params - Object containing the driver ID, time-off ID and update data
 * @returns {Promise<DriverTimeOff>} The updated time-off
 * @throws {APIError} If the time-off is not found or update fails
 */
export const updateDriverTimeOff = api(
  {
    expose: true,
    method: 'PUT',
    path: '/drivers/:driverId/time-offs/:id/update',
    auth: true,
  },
  async ({
    driverId,
    id,
    ...data
  }: UpdateDriverTimeOffPayload & {
    driverId: number;
    id: number;
  }): Promise<DriverTimeOff> => {
    return await driverApplicationService.updateTimeOff(driverId, id, data);
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
    auth: true,
  },
  async ({
    driverId,
    id,
  }: {
    driverId: number;
    id: number;
  }): Promise<DriverTimeOff> => {
    return await driverApplicationService.deleteTimeOff(driverId, id);
  },
);

/**
 * Retrieves a medical check by its ID for a specific driver.
 * @param params - Object containing the driver ID and medical check ID
 * @returns {Promise<DriverMedicalCheck>} The found medical check
 * @throws {APIError} If the medical check is not found or doesn't belong to the driver
 */
export const getDriverMedicalCheck = api(
  {
    expose: true,
    method: 'GET',
    path: '/drivers/:driverId/medical-checks/:id',
    auth: true,
  },
  async ({
    driverId,
    id,
  }: {
    driverId: number;
    id: number;
  }): Promise<DriverMedicalCheck> => {
    const medicalCheck = await driverMedicalCheckRepository.findOne(id);

    // Verify the medical check belongs to the specified driver
    if (medicalCheck.driverId !== driverId) {
      throw APIError.notFound('Medical check not found for this driver');
    }

    return medicalCheck;
  },
);

/**
 * Retrieves all medical checks for a driver without pagination (useful for dropdowns).
 * @param params - Driver ID and query parameters including orderBy, filters, and searchTerm
 * @returns {Promise<ListDriverMedicalChecksResult>} Unified response with data property containing array of medical checks
 * @throws {APIError} If retrieval fails
 */
export const listDriverMedicalChecks = api(
  {
    expose: true,
    method: 'POST',
    path: '/drivers/:driverId/medical-checks/list/all',
    auth: true,
  },
  async ({
    driverId,
    ...params
  }: ListDriverMedicalChecksQueryParams & {
    driverId: number;
  }): Promise<ListDriverMedicalChecksResult> => {
    // Add driver filter to the params
    const filters = {
      ...(params.filters ?? {}),
      driverId,
    };

    const updatedParams = {
      ...params,
      filters,
    };

    const medicalChecks =
      await driverMedicalCheckRepository.findAll(updatedParams);

    return {
      data: medicalChecks,
    };
  },
);

/**
 * Retrieves medical checks for a driver with pagination (useful for tables).
 * @param params - Driver ID and pagination and query parameters including page, pageSize, orderBy, filters, and searchTerm
 * @returns {Promise<PaginatedListDriverMedicalChecksResult>} Unified paginated response with data and pagination properties
 * @throws {APIError} If retrieval fails
 */
export const listDriverMedicalChecksPaginated = api(
  {
    expose: true,
    method: 'POST',
    path: '/drivers/:driverId/medical-checks/list',
    auth: true,
  },
  async ({
    driverId,
    ...params
  }: PaginatedListDriverMedicalChecksQueryParams & {
    driverId: number;
  }): Promise<PaginatedListDriverMedicalChecksResult> => {
    // Add driver filter to the params
    const filters = {
      ...(params.filters ?? {}),
      driverId: driverId,
    };

    const updatedParams = {
      ...params,
      filters,
    };

    return await driverMedicalCheckRepository.findAllPaginated(updatedParams);
  },
);

/**
 * Retrieves a time-off by its ID for a specific driver.
 * @param params - Object containing the driver ID and time-off ID
 * @returns {Promise<DriverTimeOff>} The found time-off
 * @throws {APIError} If the time-off is not found or doesn't belong to the driver
 */
export const getDriverTimeOff = api(
  {
    expose: true,
    method: 'GET',
    path: '/drivers/:driverId/time-offs/:id',
    auth: true,
  },
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
    auth: true,
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
  {
    expose: true,
    method: 'POST',
    path: '/drivers/:driverId/time-offs/list',
    auth: true,
  },
  async ({
    driverId,
    ...params
  }: PaginatedListDriverTimeOffsQueryParams & {
    driverId: number;
  }): Promise<PaginatedListDriverTimeOffsResult> => {
    // Add driver filter to the params
    const filters = {
      ...(params.filters ?? {}),
      driverId,
    };

    const updatedParams = {
      ...params,
      filters,
    };

    return await driverTimeOffRepository.findAllPaginated(updatedParams);
  },
);
