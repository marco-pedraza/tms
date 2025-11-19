import { FieldErrorCollector } from '@repo/base-repo';
import { EntityUtils } from '@/shared/domain/entity-utils';
import { formatDateToString } from '@/shared/utils';
import { drivers } from './drivers.schema';
import type {
  CreateDriverPayload,
  Driver,
  DriverAvailabilityDetails,
  DriverEntity,
  DriverEntityDependencies,
  UpdateDriverPayload,
} from './drivers.types';
import { DriverStatus } from './drivers.types';
import type {
  CreateDriverMedicalCheckPayload,
  DriverMedicalCheck,
} from './medical-checks/medical-checks.types';
import { MedicalCheckResult } from './medical-checks/medical-checks.types';
import type {
  CreateDriverTimeOffPayload,
  DriverTimeOff,
  UpdateDriverTimeOffPayload,
} from './time-offs/time-offs.types';
import {
  isValidInitialStatus,
  isValidStatusTransition,
} from './drivers.domain';
import { driverErrors } from './drivers.errors';

export function createDriverEntity(dependencies: DriverEntityDependencies) {
  const {
    driverRepository,
    busLineRepository,
    medicalCheckRepository,
    timeOffRepository,
  } = dependencies;

  // Desestructurar las utilidades del mixin
  const { isEntityPersisted } = EntityUtils;

  /**
   * Validates driver business rules
   * @param data - The driver data to validate
   * @param isCreate - Whether this is a create operation
   * @param currentStatus - Current status for update operations
   * @throws {FieldValidationError} If validation fails
   */
  function validateDriverRules(
    data: CreateDriverPayload | UpdateDriverPayload | Partial<Driver>,
    isCreate: boolean,
    currentStatus?: DriverStatus,
  ): void {
    const collector = new FieldErrorCollector();

    // Validate initial status for create operations
    if (isCreate && data.status) {
      if (!isValidInitialStatus(data.status)) {
        driverErrors.invalidInitialStatus(collector, data.status);
      }
    }

    // Validate status transitions for update operations
    if (
      !isCreate &&
      data.status &&
      currentStatus &&
      data.status !== currentStatus
    ) {
      if (!isValidStatusTransition(currentStatus, data.status)) {
        driverErrors.invalidStatusTransition(
          collector,
          currentStatus,
          data.status,
        );
      }
    }

    collector.throwIfErrors();
  }

  /**
   * Validates uniqueness constraints for driver data
   * @param payload - The driver data to validate
   * @param excludeId - Current driver ID to exclude from uniqueness check
   * @throws {FieldValidationError} If validation fails
   */
  async function validateUniqueness(
    payload: CreateDriverPayload | UpdateDriverPayload,
    excludeId?: number,
  ): Promise<void> {
    const collector = new FieldErrorCollector();

    const fieldsToCheck = [];

    if (payload.driverKey) {
      fieldsToCheck.push({
        field: drivers.driverKey,
        value: payload.driverKey,
      });
    }

    if (payload.payrollKey) {
      fieldsToCheck.push({
        field: drivers.payrollKey,
        value: payload.payrollKey,
      });
    }

    if (fieldsToCheck.length > 0) {
      const conflicts = await driverRepository.checkUniqueness(
        fieldsToCheck,
        excludeId,
      );

      for (const conflict of conflicts) {
        collector.addError(
          conflict.field,
          'DUPLICATE',
          `Driver with ${conflict.field} '${conflict.value}' already exists`,
          conflict.value,
        );
      }
    }

    collector.throwIfErrors();
  }

  /**
   * Validates that bus line exists and returns transporter ID
   * @param busLineId - The bus line ID to validate
   * @returns Promise with transporter ID
   * @throws {FieldValidationError} If bus line not found
   */
  async function validateBusLineAndGetTransporterId(
    busLineId: number,
  ): Promise<number> {
    try {
      const busLine = await busLineRepository.findOneWithRelations(busLineId);
      return busLine.transporterId;
    } catch (error) {
      const collector = new FieldErrorCollector();
      driverErrors.busLineNotFound(collector, busLineId);
      collector.throwIfErrors();
      throw error; // Never reached, but for TypeScript
    }
  }

  function createInstance(driverData: Partial<Driver>): DriverEntity {
    const isPersisted = isEntityPersisted(driverData.id);

    /**
     * Ensures the driver is persisted before performing operations
     * @throws {FieldValidationError} If driver is not persisted
     */
    function ensurePersisted(): void {
      if (!isPersisted || !driverData.id) {
        const collector = new FieldErrorCollector();
        driverErrors.cannotOperateOnNonPersisted(collector, null);
        collector.throwIfErrors();
      }

      // Type guard for TypeScript
      if (!driverData.id) {
        throw new Error(
          'Internal error: driver.id should exist after validation',
        );
      }
    }

    /**
     * Extracts plain driver data from the entity
     * @returns Plain driver object without entity methods
     */
    function toDriver(): Driver {
      ensurePersisted();
      return driverData as Driver;
    }

    /**
     * Checks if driver has a valid status for availability
     * Valid statuses: ACTIVE, PROBATION, IN_TRAINING
     */
    function checkStatusAvailability(): {
      hasValidStatus: boolean;
      currentStatus: DriverStatus;
    } {
      const validStatuses = [
        DriverStatus.ACTIVE,
        DriverStatus.PROBATION,
        DriverStatus.IN_TRAINING,
      ];
      const hasValidStatus = validStatuses.includes(
        driverData.status as DriverStatus,
      );

      return {
        hasValidStatus,
        currentStatus: driverData.status as DriverStatus,
      };
    }

    /**
     * Checks if driver license is valid until the end date
     */
    function checkLicenseAvailability(endDate: string): {
      hasValidLicense: boolean;
      licenseExpiry: Date | string | null;
    } {
      let hasValidLicense = false;
      if (driverData.licenseExpiry) {
        const licenseExpiryDate = new Date(driverData.licenseExpiry);
        const endDateObj = new Date(endDate);
        hasValidLicense = licenseExpiryDate >= endDateObj;
      }

      return {
        hasValidLicense,
        licenseExpiry: driverData.licenseExpiry ?? null,
      };
    }

    /**
     * Gets the latest medical check for the driver
     */
    async function getLatestMedicalCheck(): Promise<{
      checkDate: Date | string;
      result: MedicalCheckResult;
      nextCheckDate: Date | string;
    } | null> {
      if (!driverData.id) {
        throw new Error(
          'Internal error: driver.id should exist for availability check',
        );
      }

      const medicalChecks = await medicalCheckRepository.findAll({
        filters: { driverId: driverData.id },
        orderBy: [{ field: 'checkDate', direction: 'desc' }],
      });

      return medicalChecks.length > 0 ? medicalChecks[0] : null;
    }

    /**
     * Checks if medical check is valid and current
     */
    function validateMedicalCheck(
      latestMedicalCheck: {
        checkDate: Date | string;
        result: MedicalCheckResult;
        nextCheckDate: Date | string;
      } | null,
    ): {
      hasValidMedicalCheck: boolean;
      medicalCheckDetails: DriverAvailabilityDetails['medicalCheckDetails'];
    } {
      if (!latestMedicalCheck) {
        return {
          hasValidMedicalCheck: false,
          medicalCheckDetails: {
            hasMedicalCheck: false,
            latestResult: null,
            latestCheckDate: null,
            nextCheckDate: null,
            isCurrent: false,
          },
        };
      }

      const validMedicalResults = [
        MedicalCheckResult.FIT,
        MedicalCheckResult.LIMITED,
      ];
      const hasValidResult = validMedicalResults.includes(
        latestMedicalCheck.result,
      );

      // Check if the medical check is still current (nextCheckDate is in the future)
      const raw = latestMedicalCheck.nextCheckDate;
      const d = new Date(raw);
      const nextCheckDate = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
      );

      const today = new Date();
      const startOfToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );

      const isCurrent = nextCheckDate >= startOfToday;
      const hasValidMedicalCheck = hasValidResult && isCurrent;

      return {
        hasValidMedicalCheck,
        medicalCheckDetails: {
          hasMedicalCheck: true,
          latestResult: latestMedicalCheck.result,
          latestCheckDate: latestMedicalCheck.checkDate,
          nextCheckDate,
          isCurrent,
        },
      };
    }

    /**
     * Checks if driver has overlapping time-offs in the date range
     */
    async function checkTimeOffAvailability(
      startDate: string,
      endDate: string,
    ): Promise<boolean> {
      if (!driverData.id) {
        throw new Error(
          'Internal error: driver.id should exist for availability check',
        );
      }

      const hasTimeOffConflict = await timeOffRepository.hasOverlappingTimeOffs(
        driverData.id,
        startDate,
        endDate,
      );

      return !hasTimeOffConflict;
    }

    /**
     * Checks if the driver is available for a given date range
     * @param startDate - Start date for availability check (YYYY-MM-DD format)
     * @param endDate - End date for availability check (YYYY-MM-DD format)
     * @returns Availability status with detailed information
     * @throws {FieldValidationError} If driver is not persisted
     */
    async function checkAvailability(
      startDate: string,
      endDate: string,
    ): Promise<{ isAvailable: boolean; details: DriverAvailabilityDetails }> {
      ensurePersisted();

      // Check 1: Valid status
      const statusCheck = checkStatusAvailability();

      // Check 2: License validity
      const licenseCheck = checkLicenseAvailability(endDate);

      // Check 3: Medical check validity
      const latestMedicalCheck = await getLatestMedicalCheck();
      const medicalCheckValidation = validateMedicalCheck(latestMedicalCheck);

      // Check 4: Time-off conflicts
      const hasNoTimeOffConflict = await checkTimeOffAvailability(
        startDate,
        endDate,
      );

      // Determine overall availability
      const isAvailable =
        statusCheck.hasValidStatus &&
        licenseCheck.hasValidLicense &&
        medicalCheckValidation.hasValidMedicalCheck &&
        hasNoTimeOffConflict;

      // Build detailed response
      const details: DriverAvailabilityDetails = {
        hasValidStatus: statusCheck.hasValidStatus,
        currentStatus: statusCheck.currentStatus,
        hasValidLicense: licenseCheck.hasValidLicense,
        licenseExpiry: licenseCheck.licenseExpiry,
        hasValidMedicalCheck: medicalCheckValidation.hasValidMedicalCheck,
        hasNoTimeOffConflict,
        medicalCheckDetails: medicalCheckValidation.medicalCheckDetails,
      };

      return {
        isAvailable,
        details,
      };
    }

    /**
     * Saves the driver to the database (create operation)
     * @returns Promise resolving to the persisted driver entity
     * @throws {FieldValidationError} If validation fails
     */
    async function save(): Promise<DriverEntity> {
      if (isPersisted) {
        // Already persisted, return same instance
        return createInstance(driverData);
      }

      const payload = driverData as CreateDriverPayload;

      // Validate business rules
      validateDriverRules(payload, true);

      // Validate uniqueness
      await validateUniqueness(payload);

      // Validate bus line and get transporter ID
      const transporterId = await validateBusLineAndGetTransporterId(
        payload.busLineId,
      );

      // Create enhanced payload with transporter ID
      const enhancedPayload = {
        ...payload,
        transporterId,
        statusDate: payload.statusDate ?? new Date(),
      };

      // Create in database
      const driver = await driverRepository.create(enhancedPayload);
      return createInstance(driver);
    }

    /**
     * Updates the driver in the database
     * @param updatePayload - The update payload
     * @returns Promise resolving to the updated driver entity
     * @throws {FieldValidationError} If validation fails
     */
    async function update(
      updatePayload: UpdateDriverPayload,
    ): Promise<DriverEntity> {
      ensurePersisted();

      const currentStatus = driverData.status as DriverStatus;

      // Validate business rules
      validateDriverRules(updatePayload, false, currentStatus);

      // Validate uniqueness (exclude current driver)
      if (!driverData.id) {
        throw new Error('Internal error: driver.id should exist for update');
      }
      await validateUniqueness(updatePayload, driverData.id);

      // Prepare update data
      const updateData: UpdateDriverPayload & { transporterId?: number } = {
        ...updatePayload,
      };

      // If bus line is being updated, get the new transporter ID
      if (typeof updatePayload.busLineId === 'number') {
        const transporterId = await validateBusLineAndGetTransporterId(
          updatePayload.busLineId,
        );
        updateData.transporterId = transporterId;
      }

      // If status is being updated, update the status date if not provided
      if (updatePayload.status && !updatePayload.statusDate) {
        updateData.statusDate = new Date();
      }

      // Update in database
      const updatedDriver = await driverRepository.update(
        driverData.id,
        updateData,
      );
      return createInstance(updatedDriver);
    }

    /**
     * Adds a medical check to this driver
     * @param payload - Medical check data (driverId set automatically)
     * @returns The created medical check
     * @throws {FieldValidationError} If validation fails
     * @throws {ValidationError} If driver is not persisted
     */
    async function addMedicalCheck(
      payload: CreateDriverMedicalCheckPayload,
    ): Promise<DriverMedicalCheck> {
      ensurePersisted();

      if (!driverData.id) {
        throw new Error(
          'Internal error: driver.id should exist for adding medical check',
        );
      }

      return await medicalCheckRepository.create({
        ...payload,
        driverId: driverData.id,
      });
    }

    /**
     * Adds a time-off to this driver
     * @param payload - Time-off data (driverId set automatically)
     * @returns The created time-off
     * @throws {FieldValidationError} If validation fails
     * @throws {ValidationError} If driver is not persisted
     */
    async function addTimeOff(
      payload: CreateDriverTimeOffPayload,
    ): Promise<DriverTimeOff> {
      ensurePersisted();

      if (!driverData.id) {
        throw new Error(
          'Internal error: driver.id should exist for adding time-off',
        );
      }

      const collector = new FieldErrorCollector();

      // Validate date range
      const startDate = new Date(payload.startDate);
      const endDate = new Date(payload.endDate);
      if (startDate > endDate) {
        const startDateStr = formatDateToString(payload.startDate);
        driverErrors.timeOffInvalidDateRange(collector, startDateStr);
      }

      // Validate overlap
      const startDateStr = formatDateToString(payload.startDate);
      const endDateStr = formatDateToString(payload.endDate);
      const hasOverlap = await timeOffRepository.hasOverlappingTimeOffs(
        driverData.id,
        startDateStr,
        endDateStr,
      );

      if (hasOverlap) {
        driverErrors.timeOffOverlapping(collector, startDateStr);
      }

      collector.throwIfErrors();

      const createData: CreateDriverTimeOffPayload & { driverId: number } = {
        ...payload,
        driverId: driverData.id,
      };

      return await timeOffRepository.create(createData);
    }

    /**
     * Updates a time-off for this driver
     * @param timeOffId - The ID of the time-off to update
     * @param payload - Time-off update data
     * @returns The updated time-off
     * @throws {FieldValidationError} If validation fails
     * @throws {NotFoundError} If time-off not found or doesn't belong to this driver
     * @throws {ValidationError} If driver is not persisted
     */
    async function updateTimeOff(
      timeOffId: number,
      payload: UpdateDriverTimeOffPayload,
    ): Promise<DriverTimeOff> {
      ensurePersisted();

      if (!driverData.id) {
        throw new Error(
          'Internal error: driver.id should exist for updating time-off',
        );
      }

      const collector = new FieldErrorCollector();

      // Verify time-off exists and belongs to this driver
      const existingTimeOff = await timeOffRepository.findOne(timeOffId);
      if (existingTimeOff.driverId !== driverData.id) {
        driverErrors.timeOffNotFound(collector, timeOffId);
        collector.throwIfErrors();
      }

      // Validate date range (only if both dates are provided)
      if (payload.startDate && payload.endDate) {
        const startDate = new Date(payload.startDate);
        const endDate = new Date(payload.endDate);
        if (startDate > endDate) {
          const startDateStr = formatDateToString(payload.startDate);
          driverErrors.timeOffInvalidDateRange(collector, startDateStr);
        }
      }

      // Validate overlap (exclude current time-off)
      if (payload.startDate && payload.endDate) {
        const startDateStr = formatDateToString(payload.startDate);
        const endDateStr = formatDateToString(payload.endDate);
        const hasOverlap = await timeOffRepository.hasOverlappingTimeOffs(
          driverData.id,
          startDateStr,
          endDateStr,
          timeOffId,
        );

        if (hasOverlap) {
          driverErrors.timeOffOverlapping(collector, startDateStr);
        }
      }

      collector.throwIfErrors();

      return await timeOffRepository.update(timeOffId, payload);
    }

    /**
     * Removes a time-off from this driver
     * @param timeOffId - The ID of the time-off to remove
     * @returns The deleted time-off
     * @throws {NotFoundError} If time-off not found or doesn't belong to this driver
     * @throws {ValidationError} If driver is not persisted
     */
    async function removeTimeOff(timeOffId: number): Promise<DriverTimeOff> {
      ensurePersisted();

      if (!driverData.id) {
        throw new Error(
          'Internal error: driver.id should exist for removing time-off',
        );
      }

      const collector = new FieldErrorCollector();

      // Verify time-off exists and belongs to this driver
      const existingTimeOff = await timeOffRepository.findOne(timeOffId);
      if (existingTimeOff.driverId !== driverData.id) {
        driverErrors.timeOffNotFound(collector, timeOffId);
        collector.throwIfErrors();
      }

      return await timeOffRepository.delete(timeOffId);
    }

    // Return entity instance with all driver properties and methods
    return {
      ...driverData,
      toDriver,
      checkAvailability,
      save,
      update,
      addMedicalCheck,
      addTimeOff,
      updateTimeOff,
      removeTimeOff,
    } as DriverEntity;
  }

  /**
   * Creates a new driver entity instance from creation payload
   * @param payload - The driver creation payload
   * @returns Driver entity instance (not yet persisted)
   */
  function create(payload: CreateDriverPayload): DriverEntity {
    return createInstance(payload);
  }

  /**
   * Creates a driver entity instance from persisted data
   * @param data - The persisted driver data
   * @returns Driver entity instance
   */
  function fromData(data: Driver): DriverEntity {
    return createInstance(data);
  }

  /**
   * Finds a driver by ID and returns as entity
   * @param id - The driver ID
   * @returns Promise resolving to driver entity
   * @throws {NotFoundError} If driver not found
   */
  async function findOne(id: number): Promise<DriverEntity> {
    const driver = await driverRepository.findOne(id);
    return fromData(driver);
  }

  return {
    create,
    fromData,
    findOne,
  };
}
