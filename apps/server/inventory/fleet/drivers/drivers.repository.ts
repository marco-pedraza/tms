import { and, inArray, isNull } from 'drizzle-orm';
import { NotFoundError, createBaseRepository } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { PaginationMeta } from '@/shared/types';
import { Bus } from '@/inventory/fleet/buses/buses.types';
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
      with: {
        transporter: true,
        busLine: true,
        base: true,
        assignedBus: { with: { bus: true } },
      },
    });

    if (!driver) {
      throw new NotFoundError(`Driver with id ${id} not found`);
    }

    const assignedBus = driver.assignedBus
      ? (driver.assignedBus.bus as unknown as Bus)
      : null;

    return {
      ...driver,
      assignedBus,
    } as DriverWithRelations;
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
      with: {
        transporter: true,
        busLine: true,
        base: true,
        assignedBus: { with: { bus: true } },
      },
    });

    const data = driversWithRelations.map((driver) => {
      const assignedBus = driver.assignedBus
        ? (driver.assignedBus.bus as unknown as Bus)
        : null;

      return {
        ...driver,
        assignedBus,
      };
    });

    return {
      data: data as DriverWithRelations[],
      pagination,
    };
  };

  /**
   * Finds existing driver IDs from a given array of IDs
   * @param driverIds - Array of driver IDs to check
   * @returns Array of driver IDs that exist in the database
   */
  const findExistingIds = async (driverIds: number[]): Promise<number[]> => {
    if (driverIds.length === 0) {
      return [];
    }

    const results = await db
      .select({ id: drivers.id })
      .from(drivers)
      .where(and(inArray(drivers.id, driverIds), isNull(drivers.deletedAt)));

    return results.map((result: { id: number }) => result.id);
  };

  /**
   * Finds multiple drivers by their IDs
   * @param driverIds - Array of driver IDs to find
   * @returns Array of drivers
   */
  const findManyByIds = async (driverIds: number[]): Promise<Driver[]> => {
    if (driverIds.length === 0) return [];
    const uniqueIds = Array.from(new Set(driverIds));
    const results = await db.query.drivers.findMany({
      where: (d, { inArray, and, isNull }) =>
        and(inArray(d.id, uniqueIds), isNull(d.deletedAt)),
    });
    return results as Driver[];
  };
  /**
   * Finds multiple drivers with relations (including assignedBus)
   * @param driverIds - IDs to load
   */
  const findManyWithRelationsByIds = async (
    driverIds: number[],
  ): Promise<DriverWithRelations[]> => {
    if (driverIds.length === 0) return [];
    const uniqueIds = Array.from(new Set(driverIds));
    const results = await db.query.drivers.findMany({
      where: (d, { inArray, and, isNull }) =>
        and(inArray(d.id, uniqueIds), isNull(d.deletedAt)),
      with: {
        transporter: true,
        busLine: true,
        base: true,
        assignedBus: { with: { bus: true } },
      },
    });
    return results.map((driver) => {
      const assignedBus = driver.assignedBus
        ? (driver.assignedBus.bus as unknown as Bus)
        : null;
      return { ...driver, assignedBus } as DriverWithRelations;
    });
  };

  return {
    ...baseRepository,
    findOneWithRelations,
    appendRelations,
    findExistingIds,
    findManyByIds,
    findManyWithRelationsByIds,
  };
};

// Export the driver repository instance
export const driverRepository = createDriverRepository();

/**
 * Type representing the complete driver repository
 * Derived from the actual implementation
 */
export type DriverRepository = typeof driverRepository;
