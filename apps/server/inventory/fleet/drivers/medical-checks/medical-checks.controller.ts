import { api } from 'encore.dev/api';
import { APIError } from 'encore.dev/api';
import type {
  CreateDriverMedicalCheckRepositoryPayload,
  DriverMedicalCheck,
  ListDriverMedicalChecksQueryParams,
  ListDriverMedicalChecksResult,
  PaginatedListDriverMedicalChecksQueryParams,
  PaginatedListDriverMedicalChecksResult,
} from './medical-checks.types';
import { driverMedicalCheckRepository } from './medical-checks.repository';

/**
 * Creates a new medical check for a driver (immutable).
 * @param params - The medical check data to create (includes driverId)
 * @returns {Promise<DriverMedicalCheck>} The created medical check
 * @throws {APIError} If the medical check creation fails
 */
export const createDriverMedicalCheck = api(
  {
    expose: true,
    method: 'POST',
    path: '/drivers/:driverId/medical-checks/create',
  },
  async ({
    driverId,
    ...data
  }: CreateDriverMedicalCheckRepositoryPayload): Promise<DriverMedicalCheck> => {
    const createData = { ...data, driverId };
    return await driverMedicalCheckRepository.create(createData);
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
