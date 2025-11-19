import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { FieldValidationError, NotFoundError } from '@repo/base-repo';
import { busLineRepository } from '@/inventory/operators/bus-lines/bus-lines.repository';
import { serviceTypeRepository } from '@/inventory/operators/service-types/service-types.repository';
import { transporterRepository } from '@/inventory/operators/transporters/transporters.repository';
import { createCleanupHelper } from '@/tests/shared/test-utils';
import {
  getDriverTimeOff,
  listDriverTimeOffs,
  listDriverTimeOffsPaginated,
} from '../drivers.controller';
import {
  createDriverTimeOff,
  deleteDriverTimeOff,
  updateDriverTimeOff,
} from '../drivers.controller';
import { driverRepository } from '../drivers.repository';
import { DriverStatus } from '../drivers.types';
import type { TimeOffType } from './time-offs.types';
import { driverTimeOffRepository } from './time-offs.repository';

/**
 * Test date utilities for generating future dates
 */
const testDateUtils = {
  /**
   * Gets a future date string in YYYY-MM-DD format
   * @param daysFromNow - Number of days from today (default: 30)
   * @returns Date string in YYYY-MM-DD format
   */
  getFutureDate(daysFromNow: number = 30): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  },

  /**
   * Gets a future Date object
   * @param daysFromNow - Number of days from today (default: 30)
   * @returns Date object
   */
  getFutureDateObject(daysFromNow: number = 30): Date {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date;
  },

  /**
   * Gets a date range for testing (start and end dates)
   * @param startDaysFromNow - Days from now for start date (default: 30)
   * @param durationDays - Duration of the time-off in days (default: 5)
   * @returns Object with startDate and endDate strings
   */
  getDateRange(
    startDaysFromNow: number = 30,
    durationDays: number = 5,
  ): { startDate: string; endDate: string } {
    const startDate = this.getFutureDate(startDaysFromNow);
    const endDate = this.getFutureDate(startDaysFromNow + durationDays);
    return { startDate, endDate };
  },

  /**
   * Gets yesterday's date (for testing past date validation)
   * @returns Date string in YYYY-MM-DD format
   */
  getYesterdayDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  },

  /**
   * Gets today's date
   * @returns Date string in YYYY-MM-DD format
   */
  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  },

  /**
   * Gets tomorrow's date
   * @returns Date string in YYYY-MM-DD format
   */
  getTomorrowDate(): string {
    return this.getFutureDate(1);
  },
};

describe('Driver Time-offs Controller', () => {
  // Test data and setup
  const testDriver = {
    driverKey: 'DRV-TOFF-001',
    payrollKey: 'PAY-TOFF-001',
    firstName: 'John',
    lastName: 'Doe',
    address: '123 Main St, Downtown, Mexico City, CDMX, 12345',
    phone: '+52 55 12345678',
    email: 'john.doe.timeoff@example.com',
    hireDate: '2020-01-15',
    status: DriverStatus.ACTIVE,
    statusDate: '2020-01-15',
    license: 'LIC-TOFF-12345',
    licenseExpiry: '2026-01-15',
    transporterId: 0, // Will be set in beforeAll
    busLineId: 0, // Will be set in beforeAll
    emergencyContactName: 'John Doe',
    emergencyContactPhone: '+52 33 1234 5678',
    emergencyContactRelationship: 'Father',
  };

  // Cleanup helpers
  const timeOffCleanup = createCleanupHelper(
    ({ id }) => driverTimeOffRepository.forceDelete(id),
    'timeOff',
  );

  const driverCleanup = createCleanupHelper(
    ({ id }) => driverRepository.forceDelete(id),
    'driver',
  );

  const busLineCleanup = createCleanupHelper(
    ({ id }) => busLineRepository.forceDelete(id),
    'busLine',
  );

  const transporterCleanup = createCleanupHelper(
    ({ id }) => transporterRepository.forceDelete(id),
    'transporter',
  );

  const serviceTypeCleanup = createCleanupHelper(
    ({ id }) => serviceTypeRepository.forceDelete(id),
    'serviceType',
  );

  // Variable to store created IDs for cleanup
  let createdDriverId: number;
  let createdTransporterId: number;
  let createdBusLineId: number;
  let createdServiceTypeId: number;

  // Setup test transporter and bus line
  beforeAll(async () => {
    try {
      // Create test service type
      const testServiceType = await serviceTypeRepository.create({
        name: 'Test Service Type for Time-offs',
        code: 'TSTSTD-TOFF',
        description: 'Test service type for driver time-off relations',
        active: true,
      });
      createdServiceTypeId = testServiceType.id;
      serviceTypeCleanup.track(testServiceType.id);

      // Create test transporter
      const testTransporter = await transporterRepository.create({
        name: 'Test Transporter for Time-offs',
        code: 'TST001-TOFF',
        description: 'Test transporter for driver time-off relations',
        contactInfo: 'test.timeoff@transporter.com',
        licenseNumber: 'LIC001-TOFF',
        active: true,
      });
      createdTransporterId = testTransporter.id;
      transporterCleanup.track(testTransporter.id);

      // Create test bus line
      const testBusLine = await busLineRepository.create({
        name: 'Test Bus Line for Time-offs',
        code: 'BL001-TOFF',
        transporterId: createdTransporterId,
        serviceTypeId: createdServiceTypeId,
        description: 'Test bus line for driver time-off relations',
        active: true,
      });
      createdBusLineId = testBusLine.id;
      busLineCleanup.track(testBusLine.id);

      // Set IDs in test driver
      testDriver.transporterId = createdTransporterId;
      testDriver.busLineId = createdBusLineId;
    } catch (error) {
      console.log('Error setting up test data:', error);
    }
  });

  afterAll(async () => {
    // Cleanup order (respecting foreign key dependencies):
    // 1. time-offs (referenced by drivers)
    await timeOffCleanup.cleanupAll();
    // 2. drivers (referenced by bus lines)
    await driverCleanup.cleanupAll();
    // 3. bus lines (referenced by transporters and service types)
    await busLineCleanup.cleanupAll();
    // 4. transporters (referenced by bus lines)
    await transporterCleanup.cleanupAll();
    // 5. service types (referenced by bus lines)
    await serviceTypeCleanup.cleanupAll();
  });

  describe('success scenarios', () => {
    test('should create a new time-off for a driver', async () => {
      // Create a test driver first
      const driver = await driverRepository.create(testDriver);
      createdDriverId = driver.id;
      driverCleanup.track(createdDriverId);

      const { startDate, endDate } = testDateUtils.getDateRange(30, 5);
      const timeOffData = {
        driverId: driver.id,
        startDate,
        endDate,
        type: 'VACATION' as TimeOffType,
        reason: 'Annual vacation',
      };

      const response = await createDriverTimeOff(timeOffData);
      timeOffCleanup.track(response.id);

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.driverId).toBe(driver.id);
      expect(response.startDate).toBe(timeOffData.startDate);
      expect(response.endDate).toBe(timeOffData.endDate);
      expect(response.type).toBe(timeOffData.type);
      expect(response.reason).toBe(timeOffData.reason);
      expect(response.createdAt).toBeDefined();
      expect(response.updatedAt).toBeDefined();

      // Test edge case: single-day time-off (same start and end dates)
      const singleDayDate = testDateUtils.getFutureDate(40);
      const singleDayTimeOff = await createDriverTimeOff({
        driverId: driver.id,
        startDate: singleDayDate,
        endDate: singleDayDate, // Same as start date
        type: 'PERSONAL_DAY' as TimeOffType,
        reason: 'Single day off',
      });
      timeOffCleanup.track(singleDayTimeOff.id);

      expect(singleDayTimeOff).toBeDefined();
      expect(singleDayTimeOff.startDate).toBe(singleDayDate);
      expect(singleDayTimeOff.endDate).toBe(singleDayDate);
    });

    test('should retrieve a time-off by ID', async () => {
      // Create a test driver
      const driver = await driverRepository.create({
        ...testDriver,
        driverKey: 'DRV-TOFF-002',
        payrollKey: 'PAY-TOFF-002',
        email: 'john.doe.timeoff2@example.com',
      });
      driverCleanup.track(driver.id);

      // Create a time-off
      const timeOffData = {
        driverId: driver.id,
        startDate: '2025-12-10',
        endDate: '2025-12-12',
        type: 'SICK_LEAVE' as TimeOffType,
        reason: 'Medical appointment',
      };

      const created = await createDriverTimeOff(timeOffData);
      timeOffCleanup.track(created.id);

      // Retrieve it
      const response = await getDriverTimeOff({
        driverId: driver.id,
        id: created.id,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(created.id);
      expect(response.driverId).toBe(driver.id);
      expect(response.type).toBe(timeOffData.type);
      expect(response.startDate).toBe(timeOffData.startDate);
      expect(response.endDate).toBe(timeOffData.endDate);
    });

    test('should update a time-off', async () => {
      // Create a test driver
      const driver = await driverRepository.create({
        ...testDriver,
        driverKey: 'DRV-TOFF-003',
        payrollKey: 'PAY-TOFF-003',
        email: 'john.doe.timeoff3@example.com',
      });
      driverCleanup.track(driver.id);

      // Create a time-off first
      const timeOffData = {
        driverId: driver.id,
        startDate: '2025-12-15',
        endDate: '2025-12-17',
        type: 'PERSONAL_DAY' as TimeOffType,
        reason: 'Personal matters',
      };

      const created = await createDriverTimeOff(timeOffData);
      timeOffCleanup.track(created.id);

      // Update it
      const updatedReason = 'Updated personal matters';
      const response = await updateDriverTimeOff({
        driverId: driver.id,
        id: created.id,
        reason: updatedReason,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(created.id);
      expect(response.reason).toBe(updatedReason);
      expect(response.type).toBe(timeOffData.type); // Should remain unchanged
      expect(response.startDate).toBe(timeOffData.startDate);
      expect(response.endDate).toBe(timeOffData.endDate);
    });

    test('should list all time-offs for a driver', async () => {
      // Create a test driver
      const driver = await driverRepository.create({
        ...testDriver,
        driverKey: 'DRV-TOFF-004',
        payrollKey: 'PAY-TOFF-004',
        email: 'john.doe.timeoff4@example.com',
      });
      driverCleanup.track(driver.id);

      // Create multiple time-offs
      const timeOff1 = await createDriverTimeOff({
        driverId: driver.id,
        startDate: '2025-12-20',
        endDate: '2025-12-22',
        type: 'VACATION' as TimeOffType,
        reason: 'Short vacation',
      });
      timeOffCleanup.track(timeOff1.id);

      const timeOff2 = await createDriverTimeOff({
        driverId: driver.id,
        startDate: '2025-12-25',
        endDate: '2025-12-27',
        type: 'LEAVE' as TimeOffType,
        reason: 'Holiday leave',
      });
      timeOffCleanup.track(timeOff2.id);

      // List all
      const response = await listDriverTimeOffs({
        driverId: driver.id,
      });

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThanOrEqual(2);

      // Should include our created time-offs
      const foundIds = response.data.map((timeOff) => timeOff.id);
      expect(foundIds).toContain(timeOff1.id);
      expect(foundIds).toContain(timeOff2.id);
    });

    test('should list time-offs with pagination', async () => {
      // Create a test driver
      const driver = await driverRepository.create({
        ...testDriver,
        driverKey: 'DRV-TOFF-005',
        payrollKey: 'PAY-TOFF-005',
        email: 'john.doe.timeoff5@example.com',
      });
      driverCleanup.track(driver.id);

      const response = await listDriverTimeOffsPaginated({
        driverId: driver.id,
        page: 1,
        pageSize: 10,
      });

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.pagination).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(10);
      expect(response.pagination.totalCount).toBeDefined();
      expect(response.pagination.totalPages).toBeDefined();
      expect(typeof response.pagination.hasNextPage).toBe('boolean');
      expect(typeof response.pagination.hasPreviousPage).toBe('boolean');
    });

    test('should delete a time-off', async () => {
      // Create a test driver
      const driver = await driverRepository.create({
        ...testDriver,
        driverKey: 'DRV-TOFF-006',
        payrollKey: 'PAY-TOFF-006',
        email: 'john.doe.timeoff6@example.com',
      });
      driverCleanup.track(driver.id);

      // Create a time-off specifically for deletion test
      const timeOffToDelete = await createDriverTimeOff({
        driverId: driver.id,
        startDate: '2025-12-30',
        endDate: '2025-12-31',
        type: 'OTHER' as TimeOffType,
        reason: 'To be deleted',
      });
      timeOffCleanup.track(timeOffToDelete.id);

      // Delete should not throw an error
      await expect(
        deleteDriverTimeOff({
          driverId: driver.id,
          id: timeOffToDelete.id,
        }),
      ).resolves.not.toThrow();

      // Attempt to get should throw a not found error
      await expect(
        getDriverTimeOff({
          driverId: driver.id,
          id: timeOffToDelete.id,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    test('should create a time-off with Date objects', async () => {
      // Create a test driver
      const driver = await driverRepository.create({
        ...testDriver,
        driverKey: 'DRV-TOFF-007',
        payrollKey: 'PAY-TOFF-007',
        email: 'john.doe.timeoff7@example.com',
      });
      driverCleanup.track(driver.id);

      // Create time-off with Date objects - use local timezone to avoid UTC conversion issues
      const startDate = testDateUtils.getFutureDateObject(50);
      const endDate = testDateUtils.getFutureDateObject(55);

      const timeOff = await createDriverTimeOff({
        driverId: driver.id,
        startDate,
        endDate,
        type: 'VACATION' as TimeOffType,
        reason: 'Vacation with Date objects',
      });
      timeOffCleanup.track(timeOff.id);

      // Verify the time-off was created correctly
      expect(timeOff).toBeDefined();
      expect(timeOff.id).toBeDefined();
      expect(timeOff.driverId).toBe(driver.id);
      // Use local date conversion to avoid timezone issues
      const expectedStartDate =
        startDate.getFullYear() +
        '-' +
        String(startDate.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(startDate.getDate()).padStart(2, '0');
      const expectedEndDate =
        endDate.getFullYear() +
        '-' +
        String(endDate.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(endDate.getDate()).padStart(2, '0');

      expect(timeOff.startDate).toBe(expectedStartDate);
      expect(timeOff.endDate).toBe(expectedEndDate);
      expect(timeOff.type).toBe('VACATION');
      expect(timeOff.reason).toBe('Vacation with Date objects');
    });
  });

  describe('error scenarios', () => {
    test('should handle driver not found errors', async () => {
      await expect(
        createDriverTimeOff({
          driverId: 99999,
          startDate: '2025-12-01',
          endDate: '2025-12-02',
          type: 'VACATION' as TimeOffType,
        }),
      ).rejects.toThrow();
    });

    test('should handle time-off not found errors', async () => {
      await expect(
        getDriverTimeOff({
          driverId: createdDriverId,
          id: 99999,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    test('should handle time-off belonging to different driver', async () => {
      // Create a test driver
      const driver = await driverRepository.create({
        ...testDriver,
        driverKey: 'DRV-TOFF-008',
        payrollKey: 'PAY-TOFF-008',
        email: 'john.doe.timeoff8@example.com',
      });
      driverCleanup.track(driver.id);

      // Create a time-off
      const timeOff = await createDriverTimeOff({
        driverId: driver.id,
        startDate: '2025-12-01',
        endDate: '2025-12-02',
        type: 'VACATION' as TimeOffType,
        reason: 'Test vacation',
      });
      timeOffCleanup.track(timeOff.id);

      // Try to access it with a different driver ID
      await expect(
        getDriverTimeOff({
          driverId: 99999,
          id: timeOff.id,
        }),
      ).rejects.toThrow();
    });

    test('should allow updating time-off dates without overlap validation for same time-off', async () => {
      // Create a test driver
      const driver = await driverRepository.create({
        ...testDriver,
        driverKey: 'DRV-TOFF-015',
        payrollKey: 'PAY-TOFF-015',
        email: 'john.doe.timeoff15@example.com',
      });
      driverCleanup.track(driver.id);

      // Create a time-off
      const timeOff = await createDriverTimeOff({
        driverId: driver.id,
        ...testDateUtils.getDateRange(60, 5),
        type: 'VACATION' as TimeOffType,
        reason: 'Original vacation',
      });
      timeOffCleanup.track(timeOff.id);

      // Update the same time-off with overlapping dates (should be allowed since it's the same record)
      const updatedTimeOff = await updateDriverTimeOff({
        driverId: driver.id,
        id: timeOff.id,
        ...testDateUtils.getDateRange(62, 5), // Overlaps with original but it's the same record
        reason: 'Updated vacation dates',
      });

      expect(updatedTimeOff).toBeDefined();
      expect(updatedTimeOff.id).toBe(timeOff.id);
      expect(updatedTimeOff.startDate).toBeDefined();
      expect(updatedTimeOff.endDate).toBeDefined();
      expect(updatedTimeOff.reason).toBe('Updated vacation dates');
    });

    test('should prevent updating time-off when new dates overlap with different time-off', async () => {
      // Create a test driver
      const driver = await driverRepository.create({
        ...testDriver,
        driverKey: 'DRV-TOFF-016',
        payrollKey: 'PAY-TOFF-016',
        email: 'john.doe.timeoff16@example.com',
      });
      driverCleanup.track(driver.id);

      // Create first time-off
      const timeOff1 = await createDriverTimeOff({
        driverId: driver.id,
        ...testDateUtils.getDateRange(70, 5),
        type: 'VACATION' as TimeOffType,
        reason: 'First vacation',
      });
      timeOffCleanup.track(timeOff1.id);

      // Create second time-off
      const timeOff2 = await createDriverTimeOff({
        driverId: driver.id,
        ...testDateUtils.getDateRange(80, 6),
        type: 'SICK_LEAVE' as TimeOffType,
        reason: 'Sick leave',
      });
      timeOffCleanup.track(timeOff2.id);

      // Try to update second time-off to overlap with first one
      let validationError: FieldValidationError | undefined;
      try {
        await updateDriverTimeOff({
          driverId: driver.id,
          id: timeOff2.id,
          ...testDateUtils.getDateRange(72, 6), // Overlaps with first time-off
        });
      } catch (error) {
        validationError = error as FieldValidationError;
      }

      expect(validationError).toBeDefined();
      const typedValidationError = validationError as FieldValidationError;
      expect(typedValidationError.name).toBe('FieldValidationError');
      expect(typedValidationError.fieldErrors).toBeDefined();

      const overlapError = typedValidationError.fieldErrors.find(
        (error) => error.field === 'startDate',
      );
      expect(overlapError).toBeDefined();
      expect(overlapError?.code).toBe('OVERLAPPING_TIME_OFF');
    });

    describe('field validation errors', () => {
      test('should throw validation error for invalid date range', async () => {
        // Create a test driver
        const driver = await driverRepository.create({
          ...testDriver,
          driverKey: 'DRV-TOFF-009',
          payrollKey: 'PAY-TOFF-009',
          email: 'john.doe.timeoff9@example.com',
        });
        driverCleanup.track(driver.id);

        const invalidTimeOffData = {
          driverId: driver.id,
          startDate: '2025-12-10',
          endDate: '2025-12-05', // End date before start date
          type: 'VACATION' as TimeOffType,
        };

        // Capture the error to make specific assertions
        let validationError: FieldValidationError | undefined;
        try {
          await createDriverTimeOff(invalidTimeOffData);
        } catch (error) {
          validationError = error as FieldValidationError;
        }

        expect(validationError).toBeDefined();
        const typedValidationError = validationError as FieldValidationError;
        expect(typedValidationError.name).toBe('FieldValidationError');
        expect(typedValidationError.message).toContain('Validation failed');
        expect(typedValidationError.fieldErrors).toBeDefined();
        expect(Array.isArray(typedValidationError.fieldErrors)).toBe(true);
        expect(typedValidationError.fieldErrors.length).toBeGreaterThan(0);

        const dateRangeError = typedValidationError.fieldErrors.find(
          (error) => error.field === 'startDate',
        );
        expect(dateRangeError).toBeDefined();
        expect(dateRangeError?.code).toBe('INVALID_DATE_RANGE');
        expect(dateRangeError?.message).toContain(
          'Start date must be less than or equal to end date',
        );
      });

      test('should allow time-off in the past', async () => {
        // Create a test driver
        const driver = await driverRepository.create({
          ...testDriver,
          driverKey: 'DRV-TOFF-PAST',
          payrollKey: 'PAY-TOFF-PAST',
          email: 'john.doe.past@example.com',
        });
        driverCleanup.track(driver.id);

        // Create a date in the past
        const pastDate = testDateUtils.getYesterdayDate();

        const pastTimeOffData = {
          driverId: driver.id,
          startDate: pastDate,
          endDate: pastDate,
          type: 'VACATION' as TimeOffType,
          reason: 'Past vacation',
        };

        // This should now succeed
        const timeOff = await createDriverTimeOff(pastTimeOffData);
        timeOffCleanup.track(timeOff.id);

        expect(timeOff).toBeDefined();
        expect(timeOff.id).toBeDefined();
        expect(timeOff.driverId).toBe(driver.id);
        expect(timeOff.startDate).toBe(pastDate);
        expect(timeOff.endDate).toBe(pastDate);
        expect(timeOff.type).toBe('VACATION');
        expect(timeOff.reason).toBe('Past vacation');
      });

      test('should allow time-off starting today', async () => {
        // Create a test driver
        const driver = await driverRepository.create({
          ...testDriver,
          driverKey: 'DRV-TOFF-TODAY',
          payrollKey: 'PAY-TOFF-TODAY',
          email: 'john.doe.today@example.com',
        });
        driverCleanup.track(driver.id);

        // Create a time-off starting from tomorrow (to avoid timing issues)
        const tomorrow = testDateUtils.getTomorrowDate();
        const dayAfterTomorrow = testDateUtils.getFutureDate(2);

        const futureTimeOffData = {
          driverId: driver.id,
          startDate: tomorrow,
          endDate: dayAfterTomorrow,
          type: 'SICK_LEAVE' as TimeOffType,
          reason: 'Starting tomorrow',
        };

        // This should not throw an error
        const timeOff = await createDriverTimeOff(futureTimeOffData);
        timeOffCleanup.track(timeOff.id);

        expect(timeOff).toBeDefined();
        expect(timeOff.id).toBeDefined();
        expect(timeOff.driverId).toBe(driver.id);
        expect(timeOff.startDate).toBe(tomorrow);
        expect(timeOff.endDate).toBe(dayAfterTomorrow);
        expect(timeOff.type).toBe('SICK_LEAVE');
        expect(timeOff.reason).toBe('Starting tomorrow');
      });

      test('should throw validation error for overlapping time-offs', async () => {
        // Create a test driver
        const driver = await driverRepository.create({
          ...testDriver,
          driverKey: 'DRV-TOFF-010',
          payrollKey: 'PAY-TOFF-010',
          email: 'john.doe.timeoff10@example.com',
        });
        driverCleanup.track(driver.id);

        // Create a time-off first
        const timeOff1 = await createDriverTimeOff({
          driverId: driver.id,
          ...testDateUtils.getDateRange(90, 6),
          type: 'VACATION' as TimeOffType,
          reason: 'First vacation',
        });
        timeOffCleanup.track(timeOff1.id);

        // Try to create an overlapping time-off
        const overlappingTimeOffData = {
          driverId: driver.id,
          ...testDateUtils.getDateRange(92, 7), // Overlaps with existing time-off
          type: 'SICK_LEAVE' as TimeOffType,
          reason: 'Overlapping sick leave',
        };

        // Capture the error to make specific assertions
        let validationError: FieldValidationError | undefined;
        try {
          await createDriverTimeOff(overlappingTimeOffData);
        } catch (error) {
          validationError = error as FieldValidationError;
        }

        expect(validationError).toBeDefined();
        const typedValidationError = validationError as FieldValidationError;
        expect(typedValidationError.name).toBe('FieldValidationError');
        expect(typedValidationError.message).toContain('Validation failed');
        expect(typedValidationError.fieldErrors).toBeDefined();

        const overlapError = typedValidationError.fieldErrors.find(
          (error) => error.field === 'startDate',
        );
        expect(overlapError).toBeDefined();
        expect(overlapError?.code).toBe('OVERLAPPING_TIME_OFF');
        expect(overlapError?.message).toContain(
          'This time-off period overlaps with an existing time-off',
        );
      });

      test('should allow adjacent time-offs without overlap', async () => {
        // Create a test driver
        const driver = await driverRepository.create({
          ...testDriver,
          driverKey: 'DRV-TOFF-011',
          payrollKey: 'PAY-TOFF-011',
          email: 'john.doe.timeoff11@example.com',
        });
        driverCleanup.track(driver.id);

        // Create a time-off
        const timeOff1 = await createDriverTimeOff({
          driverId: driver.id,
          ...testDateUtils.getDateRange(100, 5),
          type: 'VACATION' as TimeOffType,
          reason: 'First vacation',
        });
        timeOffCleanup.track(timeOff1.id);

        // Create adjacent time-off (should be allowed)
        const adjacentTimeOff = await createDriverTimeOff({
          driverId: driver.id,
          ...testDateUtils.getDateRange(106, 5), // Day after the first ends
          type: 'PERSONAL_DAY' as TimeOffType,
          reason: 'Personal day',
        });
        timeOffCleanup.track(adjacentTimeOff.id);

        expect(adjacentTimeOff).toBeDefined();
        expect(adjacentTimeOff.id).toBeDefined();
        expect(adjacentTimeOff.driverId).toBe(driver.id);
        expect(adjacentTimeOff.startDate).toBeDefined();
        expect(adjacentTimeOff.endDate).toBeDefined();
      });

      test('should throw validation error for multiple overlap scenarios', async () => {
        // Create a test driver
        const driver = await driverRepository.create({
          ...testDriver,
          driverKey: 'DRV-TOFF-012',
          payrollKey: 'PAY-TOFF-012',
          email: 'john.doe.timeoff12@example.com',
        });
        driverCleanup.track(driver.id);

        // Create existing time-off for overlap testing
        const existingTimeOff = await createDriverTimeOff({
          driverId: driver.id,
          ...testDateUtils.getDateRange(110, 6),
          type: 'VACATION' as TimeOffType,
          reason: 'Existing vacation',
        });
        timeOffCleanup.track(existingTimeOff.id);

        // Test different overlap scenarios
        const baseRange = testDateUtils.getDateRange(110, 6);
        const overlapScenarios = [
          {
            name: 'end date overlaps',
            ...testDateUtils.getDateRange(108, 7),
          },
          {
            name: 'start date within existing period',
            ...testDateUtils.getDateRange(112, 7),
          },
          {
            name: 'completely contains existing period',
            ...testDateUtils.getDateRange(109, 8),
          },
          {
            name: 'exact overlap',
            ...baseRange,
          },
        ];

        for (const scenario of overlapScenarios) {
          let validationError: FieldValidationError | undefined;
          try {
            await createDriverTimeOff({
              driverId: driver.id,
              startDate: scenario.startDate,
              endDate: scenario.endDate,
              type: 'SICK_LEAVE' as TimeOffType,
              reason: `Test ${scenario.name}`,
            });
          } catch (error) {
            validationError = error as FieldValidationError;
          }

          expect(validationError).toBeDefined();
          expect(validationError?.name).toBe('FieldValidationError');

          const overlapError = validationError?.fieldErrors.find(
            (error) => error.field === 'startDate',
          );
          expect(overlapError).toBeDefined();
          expect(overlapError?.code).toBe('OVERLAPPING_TIME_OFF');
        }
      });

      test('should handle partial date updates correctly', async () => {
        // Create a test driver
        const driver = await driverRepository.create({
          ...testDriver,
          driverKey: 'DRV-TOFF-017',
          payrollKey: 'PAY-TOFF-017',
          email: 'john.doe.timeoff17@example.com',
        });
        driverCleanup.track(driver.id);

        // Create a time-off
        const timeOff = await createDriverTimeOff({
          driverId: driver.id,
          ...testDateUtils.getDateRange(120, 5),
          type: 'VACATION' as TimeOffType,
          reason: 'Original vacation',
        });
        timeOffCleanup.track(timeOff.id);

        // Update only the reason (no date validation should occur)
        const updatedTimeOff = await updateDriverTimeOff({
          driverId: driver.id,
          id: timeOff.id,
          reason: 'Updated reason only',
        });

        expect(updatedTimeOff).toBeDefined();
        expect(updatedTimeOff.reason).toBe('Updated reason only');
        expect(updatedTimeOff.startDate).toBeDefined(); // Should remain unchanged
        expect(updatedTimeOff.endDate).toBeDefined(); // Should remain unchanged
      });
    });
  });

  describe('pagination and listing', () => {
    let testDriverForListing: number;

    beforeAll(async () => {
      // Create a test driver for pagination tests
      const driver = await driverRepository.create({
        ...testDriver,
        driverKey: 'DRV-TOFF-PAGINATION',
        payrollKey: 'PAY-TOFF-PAGINATION',
        email: 'john.doe.pagination@example.com',
      });
      testDriverForListing = driver.id;
      driverCleanup.track(testDriverForListing);

      // Create several test time-offs
      const timeOffs = [
        {
          ...testDateUtils.getDateRange(130, 3),
          type: 'VACATION' as TimeOffType,
        },
        {
          ...testDateUtils.getDateRange(135, 3),
          type: 'SICK_LEAVE' as TimeOffType,
        },
        {
          ...testDateUtils.getDateRange(140, 3),
          type: 'PERSONAL_DAY' as TimeOffType,
        },
      ];

      for (const timeOff of timeOffs) {
        const created = await createDriverTimeOff({
          driverId: testDriverForListing,
          ...timeOff,
          reason: `Test ${timeOff.type}`,
        });
        timeOffCleanup.track(created.id);
      }
    });

    test('should handle both paginated and non-paginated listing', async () => {
      // Test paginated response
      const paginatedResponse = await listDriverTimeOffsPaginated({
        driverId: testDriverForListing,
        page: 1,
        pageSize: 5,
      });

      expect(paginatedResponse.data).toBeDefined();
      expect(Array.isArray(paginatedResponse.data)).toBe(true);
      expect(paginatedResponse.pagination).toBeDefined();
      expect(paginatedResponse.pagination.currentPage).toBe(1);
      expect(paginatedResponse.pagination.pageSize).toBe(5);
      expect(typeof paginatedResponse.pagination.hasNextPage).toBe('boolean');

      // Test non-paginated response
      const nonPaginatedResponse = await listDriverTimeOffs({
        driverId: testDriverForListing,
      });

      expect(nonPaginatedResponse.data).toBeDefined();
      expect(Array.isArray(nonPaginatedResponse.data)).toBe(true);
      expect(nonPaginatedResponse.data.length).toBeGreaterThanOrEqual(3);
      expect(nonPaginatedResponse).not.toHaveProperty('pagination');
    });

    test('should support filtering and ordering', async () => {
      // Test filtering by type
      const filteredResponse = await listDriverTimeOffs({
        driverId: testDriverForListing,
        filters: { type: 'VACATION' as TimeOffType },
      });

      expect(
        filteredResponse.data.every((timeOff) => timeOff.type === 'VACATION'),
      ).toBe(true);

      // Test ordering with pagination
      const orderedResponse = await listDriverTimeOffsPaginated({
        driverId: testDriverForListing,
        orderBy: [{ field: 'startDate', direction: 'asc' }],
        pageSize: 10,
      });

      const startDates = orderedResponse.data.map((t) => new Date(t.startDate));
      for (let i = 0; i < startDates.length - 1; i++) {
        expect(startDates[i] <= startDates[i + 1]).toBe(true);
      }
    });
  });
});
