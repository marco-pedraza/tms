import { ValidationError } from '@repo/base-repo';
import { busLineRepository } from '@/inventory/operators/bus-lines/bus-lines.repository';
import type {
  CreateDriverPayload,
  Driver,
  DriverAvailability,
  DriverAvailabilityDetails,
  DriverWithRelations,
  ListDriversAvailabilityQueryParams,
  ListDriversAvailabilityResult,
  UpdateDriverPayload,
} from './drivers.types';
import { DriverStatus } from './drivers.types';
import {
  DriverMedicalCheck,
  MedicalCheckResult,
} from './medical-checks/medical-checks.types';
import { driverRepository } from './drivers.repository';
import { driverMedicalCheckRepository } from './medical-checks/medical-checks.repository';
import { driverTimeOffRepository } from './time-offs/time-offs.repository';

/**
 * Creates a use case module for driver operations that involve complex business logic
 * @returns {Object} An object containing driver-specific operations
 */
export function createDriverUseCases() {
  /**
   * Gets the transporter ID associated with a bus line
   * @param busLineId - The ID of the bus line
   * @returns {Promise<number>} The transporter ID associated with the bus line
   * @throws {ValidationError} If the bus line is not found or invalid
   */
  const getTransporterIdFromBusLine = async (
    busLineId: number,
  ): Promise<number> => {
    // Validate that the bus line exists and get its transporter
    const busLineWithTransporter =
      await busLineRepository.findOneWithRelations(busLineId);

    return busLineWithTransporter.transporterId;
  };

  /**
   * Gets the most recent medical check for a driver
   * @param driverId - The ID of the driver
   * @returns {Promise<DriverMedicalCheck | null>} The most recent medical check or null if none exists
   */
  const getLatestMedicalCheck = async (
    driverId: number,
  ): Promise<DriverMedicalCheck | null> => {
    const medicalChecks = await driverMedicalCheckRepository.findAll({
      filters: {
        driverId: driverId,
      },
      orderBy: [
        {
          field: 'checkDate',
          direction: 'desc',
        },
      ],
    });

    return medicalChecks.length > 0 ? medicalChecks[0] : null;
  };

  /**
   * Checks if a driver is available based on status, license, medical check, and time-off
   * @param driver - The driver
   * @param startDate - The start date to check availability from
   * @param endDate - The end date to check availability until
   * @returns {Promise<{ isAvailable: boolean; details: DriverAvailabilityDetails }>} Availability status with detailed information
   */
  const checkDriverAvailability = async (
    driver: Driver,
    startDate: string,
    endDate: string,
  ): Promise<{ isAvailable: boolean; details: DriverAvailabilityDetails }> => {
    // Check 1: Valid status (active, probation, in_training)
    const validStatuses = [
      DriverStatus.ACTIVE,
      DriverStatus.PROBATION,
      DriverStatus.IN_TRAINING,
    ];
    const hasValidStatus = validStatuses.includes(driver.status);

    // Check 2: License must be valid until endDate
    let hasValidLicense = false;
    if (driver.licenseExpiry) {
      const licenseExpiryDate = new Date(driver.licenseExpiry);
      const endDateObj = new Date(endDate);
      hasValidLicense = licenseExpiryDate >= endDateObj;
    }

    // Check 3: Must have a valid and current medical check
    const latestMedicalCheck = await getLatestMedicalCheck(driver.id);
    const hasMedicalCheck = latestMedicalCheck !== null;

    let hasValidMedicalCheck = false;
    let nextCheckDate: Date | null = null;
    let isCurrent = false;

    if (latestMedicalCheck) {
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
      nextCheckDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

      const today = new Date();
      const startOfToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );

      isCurrent = nextCheckDate >= startOfToday;
      hasValidMedicalCheck = hasValidResult && isCurrent;
    }

    // Check 4: Must not be in a time-off period
    const hasTimeOffConflict =
      await driverTimeOffRepository.hasOverlappingTimeOffs(
        driver.id,
        startDate,
        endDate,
      );
    const hasNoTimeOffConflict = !hasTimeOffConflict;

    // Determine overall availability
    const isAvailable =
      hasValidStatus &&
      hasValidLicense &&
      hasValidMedicalCheck &&
      hasNoTimeOffConflict;

    // Build detailed response
    const details: DriverAvailabilityDetails = {
      hasValidStatus,
      currentStatus: driver.status,
      hasValidLicense,
      licenseExpiry: driver.licenseExpiry,
      hasValidMedicalCheck,
      hasNoTimeOffConflict,
      medicalCheckDetails: {
        hasMedicalCheck,
        latestResult: latestMedicalCheck?.result ?? null,
        latestCheckDate: latestMedicalCheck?.checkDate ?? null,
        nextCheckDate: nextCheckDate ?? null,
        isCurrent,
      },
    };

    return {
      isAvailable,
      details,
    };
  };

  /**
   * Creates a new driver with automatic transporter assignment based on bus line
   * @param data - The driver creation payload
   * @returns {Promise<DriverWithRelations>} The created driver with transporter and bus line information
   * @throws {ValidationError} If the bus line is not found or invalid
   */
  const createDriverWithTransporter = async (
    data: CreateDriverPayload,
  ): Promise<DriverWithRelations> => {
    // Get the transporter ID from the bus line
    const transporterId = await getTransporterIdFromBusLine(data.busLineId);

    // Create the driver with the obtained transporter ID
    const driverData = {
      ...data,
      transporterId,
    };

    if (!data.statusDate) {
      driverData.statusDate = new Date();
    }

    const driver = await driverRepository.create(driverData);

    // Return the driver with relations
    return await driverRepository.findOneWithRelations(driver.id);
  };

  /**
   * Updates a driver with automatic transporter assignment based on bus line (if bus line changes)
   * @param id - The ID of the driver to update
   * @param data - The driver update payload
   * @returns {Promise<DriverWithRelations>} The updated driver with transporter and bus line information
   * @throws {ValidationError} If the bus line is not found or invalid
   */
  const updateDriverWithTransporter = async (
    id: number,
    data: UpdateDriverPayload,
  ): Promise<DriverWithRelations> => {
    const updateData: UpdateDriverPayload & { transporterId?: number } = {
      ...data,
    };

    // If bus line is being updated, get the new transporter ID
    if (typeof data.busLineId === 'number') {
      const transporterId = await getTransporterIdFromBusLine(data.busLineId);
      updateData.transporterId = transporterId;
    }

    // If status is being updated, update the status date if not provided
    if (data.status && !data.statusDate) {
      updateData.statusDate = new Date();
    }

    await driverRepository.update(id, updateData);

    // Return the updated driver with relations
    return await driverRepository.findOneWithRelations(id);
  };

  /**
   * Gets the availability of drivers for a given date range with filtering and ordering support
   * @param params - Query parameters including startDate, endDate, orderBy, filters
   * @returns {Promise<GetDriversAvailabilityResult>} Unified response with data property containing array of drivers and their availability
   * @throws {ValidationError} If the date range is invalid
   */
  const getDriversAvailability = async (
    params: ListDriversAvailabilityQueryParams,
  ): Promise<ListDriversAvailabilityResult> => {
    // Handle null dates by using current date as fallback
    const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const startDate = params.startDate ?? currentDate;
    const endDate = params.endDate ?? currentDate;

    // Validate date range (startDate should be before endDate)
    if (new Date(startDate) > new Date(endDate)) {
      throw new ValidationError('Start date must be before end date');
    }

    // Extract filtering and ordering parameters (excluding date range parameters)
    const listParams = {
      orderBy: params.orderBy,
      filters: params.filters,
    };

    // Get drivers with filtering and ordering
    const drivers = await driverRepository.findAll(listParams);

    const driversWithAvailability: DriverAvailability[] = await Promise.all(
      drivers.map(async (driver) => {
        // Check availability based on business rules
        const availabilityResult = await checkDriverAvailability(
          driver,
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
  };

  return {
    getTransporterIdFromBusLine,
    createDriverWithTransporter,
    updateDriverWithTransporter,
    getDriversAvailability,
  };
}

// Export the use case instance
export const driverUseCases = createDriverUseCases();
