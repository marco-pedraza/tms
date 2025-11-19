import type { TransactionalDB } from '@repo/base-repo';
import { busLineRepository } from '@/inventory/operators/bus-lines/bus-lines.repository';
import type {
  CreateDriverPayload,
  DriverEntity,
  DriverWithRelations,
  ListDriversAvailabilityQueryParams,
  ListDriversAvailabilityResult,
  UpdateDriverPayload,
} from './drivers.types';
import type {
  CreateDriverMedicalCheckPayload,
  DriverMedicalCheck,
} from './medical-checks/medical-checks.types';
import type {
  CreateDriverTimeOffPayload,
  DriverTimeOff,
  UpdateDriverTimeOffPayload,
} from './time-offs/time-offs.types';
import { driverRepository } from './drivers.repository';
import { driverMedicalCheckRepository } from './medical-checks/medical-checks.repository';
import { driverTimeOffRepository } from './time-offs/time-offs.repository';
import { createDriverEntity } from './drivers.entity';

/**
 * Application service for driver operations
 * Handles dependency injection and exposes domain operations to controllers
 */
export function createDriverApplicationService() {
  // Initialize the driver entity factory with injected repositories
  const driverEntityFactory = createDriverEntity({
    driverRepository,
    busLineRepository,
    medicalCheckRepository: driverMedicalCheckRepository,
    timeOffRepository: driverTimeOffRepository,
  });

  /**
   * Creates transaction-aware repositories with proper interfaces
   * @param tx - The transaction instance
   * @returns Object with transaction-aware repositories
   */
  function createTransactionRepositories(tx: TransactionalDB) {
    const txDriverRepo = driverRepository.withTransaction(tx);
    const txBusLineRepo = busLineRepository.withTransaction(tx);
    const txMedicalCheckRepo = driverMedicalCheckRepository.withTransaction(tx);
    const txTimeOffRepo = driverTimeOffRepository.withTransaction(tx);

    // Create transaction-aware entity factory
    const txDriverEntityFactory = createDriverEntity({
      driverRepository: txDriverRepo,
      busLineRepository: txBusLineRepo,
      medicalCheckRepository: txMedicalCheckRepo,
      timeOffRepository: txTimeOffRepo,
    });

    return {
      txDriverRepo,
      txBusLineRepo,
      txMedicalCheckRepo,
      txTimeOffRepo,
      txDriverEntityFactory,
    };
  }

  /**
   * Executes a driver operation within a transaction
   * @param driverId - The ID of the driver to operate on
   * @param operation - The operation to execute with the driver entity
   * @returns The result of the operation
   */
  function executeInTransaction<T>(
    driverId: number,
    operation: (driverEntityInstance: DriverEntity) => Promise<T>,
  ): Promise<T> {
    return driverRepository.transaction(async (txDriverRepo, tx) => {
      const { txDriverEntityFactory } = createTransactionRepositories(tx);

      // Find driver and create entity instance
      const driver = await txDriverRepo.findOne(driverId);
      const driverEntityInstance = txDriverEntityFactory.fromData(driver);

      // Execute the operation
      return await operation(driverEntityInstance);
    });
  }

  /**
   * Creates a new driver with automatic transporter assignment based on bus line
   * @param payload - The driver creation data
   * @returns The created driver with relations
   * @throws {FieldValidationError} If validation fails
   */
  async function createDriver(
    payload: CreateDriverPayload,
  ): Promise<DriverWithRelations> {
    const driver = driverEntityFactory.create(payload);
    const savedDriver = await driver.save();
    return await driverRepository.findOneWithRelations(
      savedDriver.toDriver().id,
    );
  }

  /**
   * Updates a driver with automatic transporter assignment if bus line changes
   * @param id - The ID of the driver to update
   * @param payload - The driver update data
   * @returns The updated driver with relations
   * @throws {FieldValidationError} If validation fails
   */
  async function updateDriver(
    id: number,
    payload: UpdateDriverPayload,
  ): Promise<DriverWithRelations> {
    const driver = await driverEntityFactory.findOne(id);
    const updatedDriver = await driver.update(payload);
    return await driverRepository.findOneWithRelations(
      updatedDriver.toDriver().id,
    );
  }

  /**
   * Retrieves a driver by ID with relations
   * @param id - The ID of the driver to retrieve
   * @returns The driver with relations
   * @throws {NotFoundError} If driver not found
   */
  async function getDriver(id: number): Promise<DriverWithRelations> {
    return await driverRepository.findOneWithRelations(id);
  }

  /**
   * Soft deletes a driver
   * @param id - The ID of the driver to delete
   * @returns The deleted driver with relations
   * @throws {NotFoundError} If driver not found
   */
  async function deleteDriver(id: number): Promise<DriverWithRelations> {
    const driver = await driverRepository.findOneWithRelations(id);
    await driverRepository.delete(id);
    return driver;
  }

  /**
   * Gets the availability of drivers for a given date range
   * @param params - Query parameters including startDate, endDate, orderBy, filters
   * @returns Drivers with availability information
   */
  async function getDriversAvailability(
    params: ListDriversAvailabilityQueryParams,
  ): Promise<ListDriversAvailabilityResult> {
    // Handle null dates by using current date as fallback
    const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const startDate = params.startDate ?? currentDate;
    const endDate = params.endDate ?? currentDate;

    // Extract filtering and ordering parameters (excluding date range parameters)
    const listParams = {
      orderBy: params.orderBy,
      filters: params.filters,
    };

    // Get drivers with filtering and ordering
    const drivers = await driverRepository.findAll(listParams);

    const driversWithAvailability = await Promise.all(
      drivers.map(async (driver) => {
        const driverEntity = driverEntityFactory.fromData(driver);
        const availabilityResult = await driverEntity.checkAvailability(
          startDate,
          endDate,
        );

        return {
          ...driver,
          isAvailable: availabilityResult.isAvailable,
          availabilityDetails: availabilityResult.details,
        };
      }),
    );

    return {
      startDate,
      endDate,
      data: driversWithAvailability,
    };
  }

  // =============================================================================
  // MEDICAL CHECKS METHODS
  // =============================================================================

  /**
   * Creates a new medical check for a driver
   * @param driverId - The ID of the driver
   * @param payload - The medical check creation data
   * @returns The created medical check
   * @throws {FieldValidationError} If validation fails
   * @throws {NotFoundError} If driver not found
   */
  async function createMedicalCheck(
    driverId: number,
    payload: CreateDriverMedicalCheckPayload,
  ): Promise<DriverMedicalCheck> {
    return await executeInTransaction(driverId, async (driverEntity) => {
      return await driverEntity.addMedicalCheck(payload);
    });
  }

  // =============================================================================
  // TIME-OFFS METHODS
  // =============================================================================

  /**
   * Creates a new time-off for a driver
   * @param driverId - The ID of the driver
   * @param payload - The time-off creation data
   * @returns The created time-off
   * @throws {FieldValidationError} If validation fails
   * @throws {NotFoundError} If driver not found
   */
  async function createTimeOff(
    driverId: number,
    payload: CreateDriverTimeOffPayload,
  ): Promise<DriverTimeOff> {
    return await executeInTransaction(driverId, async (driverEntity) => {
      return await driverEntity.addTimeOff(payload);
    });
  }

  /**
   * Updates a time-off
   * @param driverId - The ID of the driver
   * @param timeOffId - The ID of the time-off
   * @param payload - The time-off update data
   * @returns The updated time-off
   * @throws {FieldValidationError} If validation fails
   * @throws {NotFoundError} If driver or time-off not found
   */
  async function updateTimeOff(
    driverId: number,
    timeOffId: number,
    payload: UpdateDriverTimeOffPayload,
  ): Promise<DriverTimeOff> {
    return await executeInTransaction(driverId, async (driverEntity) => {
      return await driverEntity.updateTimeOff(timeOffId, payload);
    });
  }

  /**
   * Deletes a time-off
   * @param driverId - The ID of the driver
   * @param timeOffId - The ID of the time-off
   * @returns The deleted time-off
   * @throws {NotFoundError} If driver or time-off not found
   */
  async function deleteTimeOff(
    driverId: number,
    timeOffId: number,
  ): Promise<DriverTimeOff> {
    return await executeInTransaction(driverId, async (driverEntity) => {
      return await driverEntity.removeTimeOff(timeOffId);
    });
  }

  return {
    createDriver,
    updateDriver,
    getDriver,
    deleteDriver,
    getDriversAvailability,
    createMedicalCheck,
    createTimeOff,
    updateTimeOff,
    deleteTimeOff,
    executeInTransaction,
  };
}

// Export the application service instance
export const driverApplicationService = createDriverApplicationService();
