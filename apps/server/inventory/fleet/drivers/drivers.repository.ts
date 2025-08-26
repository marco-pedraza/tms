import { NotFoundError, createBaseRepository } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { PaginationMeta } from '@/shared/types';
import { drivers } from './drivers.schema';
import {
  CreateDriverPayload,
  Driver,
  DriverWithRelations,
  PaginatedListDriversQueryParams,
  PaginatedListDriversResult,
  UpdateDriverPayload,
} from './drivers.types';

/**
 * Creates a repository for managing driver entities
 * @returns {Object} An object containing driver-specific operations and base CRUD operations
 */
export const createDriverRepository = () => {
  const baseRepository = createBaseRepository<
    Driver,
    CreateDriverPayload,
    UpdateDriverPayload,
    typeof drivers
  >(db, drivers, 'Driver', {
    searchableFields: [
      drivers.firstName,
      drivers.lastName,
      drivers.driverKey,
      drivers.payrollKey,
      drivers.email,
      drivers.phone,
    ],
    softDeleteEnabled: true,
  });

  /**
   * Finds a driver with its relations (transporter and bus line)
   * @param id - The ID of the driver to find
   * @returns The driver with transporter and bus line information
   * @throws {NotFoundError} If the driver is not found
   */
  const findOneWithRelations = async (
    id: number,
  ): Promise<DriverWithRelations> => {
    const driver = await db.query.drivers.findFirst({
      where: (d, { eq, and, isNull }) => and(eq(d.id, id), isNull(d.deletedAt)),
      with: { transporter: true, busLine: true },
    });

    if (!driver) {
      throw new NotFoundError(`Driver with id ${id} not found`);
    }

    return driver as DriverWithRelations;
  };

  /**
   * Appends relations (transporter and bus line) to drivers
   * @param driversResult - Array of drivers to append relations to
   * @param pagination - Pagination metadata
   * @param params - Query parameters for ordering
   * @returns Drivers with relations and pagination metadata
   */
  const appendRelations = async (
    driversResult: Driver[],
    pagination: PaginationMeta,
    params: PaginatedListDriversQueryParams,
  ): Promise<PaginatedListDriversResult> => {
    // Return early if no drivers to process
    if (driversResult.length === 0) {
      return {
        data: [],
        pagination,
      };
    }

    const { baseOrderBy } = baseRepository.buildQueryExpressions(params);
    const ids = driversResult.map((driver) => driver.id);

    const driversWithRelations = await db.query.drivers.findMany({
      where: (d, { inArray, and, isNull }) =>
        and(inArray(d.id, ids), isNull(d.deletedAt)),
      orderBy: baseOrderBy,
      with: { transporter: true, busLine: true },
    });

    return {
      data: driversWithRelations as DriverWithRelations[],
      pagination,
    };
  };

  return {
    ...baseRepository,
    findOneWithRelations,
    appendRelations,
  };
};

// Export the driver repository instance
export const driverRepository = createDriverRepository();
