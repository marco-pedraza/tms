import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import {
  FieldValidationError,
  NotFoundError,
  ValidationError,
} from '@repo/base-repo';
import { busLineRepository } from '@/inventory/operators/bus-lines/bus-lines.repository';
import { serviceTypeRepository } from '@/inventory/operators/service-types/service-types.repository';
import { ServiceTypeCategory } from '@/inventory/operators/service-types/service-types.types';
import { transporterRepository } from '@/inventory/operators/transporters/transporters.repository';
import { createCleanupHelper } from '@/tests/shared/test-utils';
import type { Driver } from './drivers.types';
import { DriverStatus } from './drivers.types';
import { MedicalCheckResult } from './medical-checks/medical-checks.types';
import { TimeOffType } from './time-offs/time-offs.types';
import { driverRepository } from './drivers.repository';
import { driverMedicalCheckRepository } from './medical-checks/medical-checks.repository';
import { driverTimeOffRepository } from './time-offs/time-offs.repository';
import {
  createDriver,
  deleteDriver,
  getDriver,
  listDrivers,
  listDriversAvailability,
  listDriversPaginated,
  updateDriver,
} from './drivers.controller';
import { createDriverMedicalCheck } from './medical-checks/medical-checks.controller';
import { createDriverTimeOff } from './time-offs/time-offs.controller';

describe('Drivers Controller', () => {
  // Test data and setup
  const testDriver = {
    driverKey: 'DRV001',
    payrollKey: 'PAY001',
    firstName: 'John',
    lastName: 'Doe',
    address: '123 Main St, Downtown, Mexico City, CDMX, 12345',
    phone: '+52 55 12345678',
    email: 'john.doe@example.com',
    hireDate: '2020-01-15',
    status: DriverStatus.ACTIVE,
    license: 'LIC12345',
    licenseExpiry: '2026-01-15',
    busLineId: 0, // Will be set in beforeAll
    emergencyContactName: 'John Doe',
    emergencyContactPhone: '+52 33 1234 5678',
    emergencyContactRelationship: 'Father',
  };

  // Cleanup helpers
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

  const medicalCheckCleanup = createCleanupHelper(
    ({ id }) => driverMedicalCheckRepository.forceDelete(id),
    'medicalCheck',
  );

  const timeOffCleanup = createCleanupHelper(
    ({ id }) => driverTimeOffRepository.forceDelete(id),
    'timeOff',
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
        name: 'Test Service Type',
        code: 'TSTSTD',
        category: ServiceTypeCategory.REGULAR,
        description: 'Test service type for driver relations',
        active: true,
      });
      createdServiceTypeId = testServiceType.id;
      serviceTypeCleanup.track(testServiceType.id);

      // Create test transporter
      const testTransporter = await transporterRepository.create({
        name: 'Test Transporter',
        code: 'TST001',
        description: 'Test transporter for driver relations',
        contactInfo: 'test@transporter.com',
        licenseNumber: 'LIC001',
        active: true,
      });
      createdTransporterId = testTransporter.id;
      transporterCleanup.track(testTransporter.id);

      // Create test bus line
      const testBusLine = await busLineRepository.create({
        name: 'Test Bus Line 1',
        code: 'BL001',
        transporterId: createdTransporterId,
        serviceTypeId: createdServiceTypeId,
        description: 'Test bus line for driver relations',
        active: true,
      });
      createdBusLineId = testBusLine.id;
      busLineCleanup.track(testBusLine.id);

      // Set busLineId in test driver
      testDriver.busLineId = createdBusLineId;
    } catch (error) {
      console.log('Error setting up test data:', error);
    }
  });

  afterAll(async () => {
    // Cleanup all tracked entities in dependency order
    // Clean up medical checks and time-offs first (they reference drivers)
    await medicalCheckCleanup.cleanupAll();
    await timeOffCleanup.cleanupAll();
    // Then clean up drivers (they reference bus lines)
    await driverCleanup.cleanupAll();
    // Then clean up bus lines (they reference transporters and service types)
    await busLineCleanup.cleanupAll();
    // Finally clean up transporters and service types
    await transporterCleanup.cleanupAll();
    await serviceTypeCleanup.cleanupAll();
  });

  describe('success scenarios', () => {
    test('should create a new driver', async () => {
      // Create a new driver
      const response = await createDriver(testDriver);

      // Store the ID for later cleanup
      createdDriverId = response.id;
      driverCleanup.track(createdDriverId);

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.driverKey).toBe(testDriver.driverKey);
      expect(response.payrollKey).toBe(testDriver.payrollKey);
      expect(response.firstName).toBe(testDriver.firstName);
      expect(response.lastName).toBe(testDriver.lastName);

      expect(response.address).toBe(testDriver.address);
      expect(response.phone).toBe(testDriver.phone);
      expect(response.email).toBe(testDriver.email);
      expect(response.emergencyContactName).toBe(
        testDriver.emergencyContactName,
      );
      expect(response.emergencyContactPhone).toBe(
        testDriver.emergencyContactPhone,
      );
      expect(response.emergencyContactRelationship).toBe(
        testDriver.emergencyContactRelationship,
      );

      expect(response.hireDate).toBe('2020-01-15');
      expect(response.status).toBe(testDriver.status);
      expect(response.statusDate).toBeDefined();
      expect(response.license).toBe(testDriver.license);
      expect(response.licenseExpiry).toBe('2026-01-15');
      expect(response.busLineId).toBe(testDriver.busLineId);

      expect(response.createdAt).toBeDefined();
      expect(response.updatedAt).toBeDefined();
    });

    test('should retrieve a driver by ID', async () => {
      const response = await getDriver({ id: createdDriverId });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdDriverId);
      expect(response.firstName).toBe(testDriver.firstName);
      expect(response.lastName).toBe(testDriver.lastName);
      expect(response.driverKey).toBe(testDriver.driverKey);
    });

    test('should update a driver', async () => {
      const updatedFirstName = 'Jane';
      const updatedLastName = 'Smith';
      const updatedStatus = DriverStatus.ON_LEAVE;

      const response = await updateDriver({
        id: createdDriverId,
        firstName: updatedFirstName,
        lastName: updatedLastName,
        status: updatedStatus,
        busLineId: createdBusLineId,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdDriverId);
      expect(response.firstName).toBe(updatedFirstName);
      expect(response.lastName).toBe(updatedLastName);
      expect(response.status).toBe(updatedStatus);

      // For dates, just verify it's defined instead of exact comparison
      expect(response.statusDate).toBeDefined();

      // Other fields should remain unchanged
      expect(response.driverKey).toBe(testDriver.driverKey);
    });

    test('should delete a driver', async () => {
      // Create a driver specifically for deletion test
      const driverToDelete = await createDriver({
        driverKey: 'DEL001',
        payrollKey: 'PAYDEL001',
        firstName: 'Driver',
        lastName: 'To Delete',
        email: 'delete.test@example.com',
        phone: '5559876543',
        status: DriverStatus.ACTIVE,
        statusDate: new Date(),
        license: 'DELLICENSE',
        licenseExpiry: new Date('2025-01-01'),
        busLineId: createdBusLineId,
      });
      driverCleanup.track(driverToDelete.id);

      // Delete should not throw an error
      await expect(
        deleteDriver({ id: driverToDelete.id }),
      ).resolves.not.toThrow();

      // Attempt to get should throw a not found error
      await expect(getDriver({ id: driverToDelete.id })).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors', async () => {
      await expect(getDriver({ id: 9999 })).rejects.toThrow(NotFoundError);
    });

    test('should handle duplicate errors', async () => {
      // Ensure the test driver exists and get fresh data
      const existingDriver = await getDriver({ id: createdDriverId });

      // Try to create driver with same driver key as existing one
      await expect(
        createDriver({
          driverKey: existingDriver.driverKey,
          payrollKey: 'PAYDUPE001',
          firstName: 'Another',
          lastName: 'Driver',
          email: 'another.driver@example.com',
          phone: '5551112233',
          status: DriverStatus.ACTIVE,
          statusDate: new Date(),
          license: 'ANOTHERLICENSE',
          licenseExpiry: new Date('2025-01-01'),
          busLineId: createdBusLineId,
        }),
      ).rejects.toThrow();
    });

    describe('field validation errors', () => {
      test('should throw detailed field validation error for duplicate driverKey', async () => {
        // Ensure the test driver exists and get fresh data
        const existingDriver = await getDriver({ id: createdDriverId });

        const duplicateDriverKeyPayload = {
          driverKey: existingDriver.driverKey, // Same driver key as existing driver
          payrollKey: 'PAYDUP001',
          firstName: 'Duplicate',
          lastName: 'Key',
          email: 'duplicate.key@example.com',
          phone: '5551112244',
          status: DriverStatus.ACTIVE,
          statusDate: new Date(),
          license: 'DUPLICATELICENSE',
          licenseExpiry: new Date('2025-01-01'),
          busLineId: createdBusLineId,
        };

        // Capture the error to make specific assertions
        let validationError: FieldValidationError | undefined;
        try {
          await createDriver(duplicateDriverKeyPayload);
        } catch (error) {
          validationError = error as FieldValidationError;
        }

        // Verify that validation error is thrown (middleware transformation happens at HTTP level)
        expect(validationError).toBeDefined();
        const typedValidationError = validationError as FieldValidationError;
        expect(typedValidationError.name).toBe('FieldValidationError');
        expect(typedValidationError.message).toContain('Validation failed');

        // The error should have fieldErrors array
        expect(typedValidationError.fieldErrors).toBeDefined();
        expect(Array.isArray(typedValidationError.fieldErrors)).toBe(true);
        expect(typedValidationError.fieldErrors).toHaveLength(1);
        expect(typedValidationError.fieldErrors[0].field).toBe('driverKey');
        expect(typedValidationError.fieldErrors[0].code).toBe('DUPLICATE');
        expect(typedValidationError.fieldErrors[0].message).toContain(
          'already exists',
        );
        expect(typedValidationError.fieldErrors[0].value).toBe(
          existingDriver.driverKey,
        );
      });

      test('should handle update validation errors correctly', async () => {
        // Create another driver to test duplicate on update
        const anotherDriver = await createDriver({
          driverKey: 'ANOTHER001',
          payrollKey: 'PAYANOTHER001',
          firstName: 'Another Test',
          lastName: 'Driver',
          email: 'another.test@example.com',
          phone: '5551112255',
          status: DriverStatus.ACTIVE,
          statusDate: new Date(),
          license: 'ANOTHERLICENSE2',
          licenseExpiry: new Date('2025-01-01'),
          busLineId: createdBusLineId,
        });

        // Ensure the test driver exists and get fresh data
        const existingDriver = await getDriver({ id: createdDriverId });

        const updatePayload = {
          id: anotherDriver.id,
          driverKey: existingDriver.driverKey, // This should trigger duplicate validation
        };

        try {
          // Capture the error to make specific assertions
          let validationError: FieldValidationError | undefined;
          try {
            await updateDriver(updatePayload);
          } catch (error) {
            validationError = error as FieldValidationError;
          }

          expect(validationError).toBeDefined();
          const typedValidationError = validationError as FieldValidationError;
          expect(typedValidationError.name).toBe('FieldValidationError');
          expect(typedValidationError.message).toContain('Validation failed');
          expect(typedValidationError.fieldErrors).toBeDefined();
          expect(typedValidationError.fieldErrors[0].field).toBe('driverKey');
          expect(typedValidationError.fieldErrors[0].code).toBe('DUPLICATE');
        } finally {
          // Clean up the additional driver
          driverCleanup.track(anotherDriver.id);
        }
      });

      test('should throw validation error for invalid initial status', async () => {
        const invalidStatusPayload = {
          driverKey: 'INVALIDSTATUS001',
          payrollKey: 'PAYINVALID001',
          firstName: 'Invalid',
          lastName: 'Status',
          email: 'invalid.status@example.com',
          phone: '5551112266',
          status: DriverStatus.INACTIVE, // Invalid initial status
          statusDate: new Date(),
          license: 'INVALIDLICENSE',
          licenseExpiry: new Date('2025-01-01'),
          busLineId: createdBusLineId,
        };

        // Capture the error to make specific assertions
        let validationError: FieldValidationError | undefined;
        try {
          await createDriver(invalidStatusPayload);
        } catch (error) {
          validationError = error as FieldValidationError;
        }

        // Verify that validation error is thrown
        expect(validationError).toBeDefined();
        const typedValidationError = validationError as FieldValidationError;
        expect(typedValidationError.name).toBe('FieldValidationError');
        expect(typedValidationError.message).toContain('Validation failed');

        // The error should have fieldErrors array with status validation error
        expect(typedValidationError.fieldErrors).toBeDefined();
        expect(Array.isArray(typedValidationError.fieldErrors)).toBe(true);
        expect(typedValidationError.fieldErrors).toHaveLength(1);

        const statusError = typedValidationError.fieldErrors[0];
        expect(statusError.field).toBe('status');
        expect(statusError.code).toBe('INVALID_STATUS');
        expect(statusError.message).toContain('Invalid initial status');
        expect(statusError.message).toContain('inactive');
        expect(statusError.message).toContain(
          'Valid initial statuses are: in_training, active, probation',
        );
        expect(statusError.value).toBe(DriverStatus.INACTIVE);
      });

      test('should throw validation error for invalid status transition during update', async () => {
        // First, create a driver with a valid initial status
        const driverToUpdate = await createDriver({
          driverKey: 'UPDATESTATUS001',
          payrollKey: 'PAYUPDATESTATUS001',
          firstName: 'Update',
          lastName: 'Status',
          email: 'update.status@example.com',
          phone: '5551112277',
          status: DriverStatus.IN_TRAINING, // Valid initial status
          statusDate: new Date(),
          license: 'UPDATELICENSE',
          licenseExpiry: new Date('2025-01-01'),
          busLineId: createdBusLineId,
        });

        try {
          // Attempt to update to an invalid status transition
          // From IN_TRAINING, we can only go to: ACTIVE, PROBATION, or TERMINATED
          // INACTIVE is not a valid transition from IN_TRAINING
          const updatePayload = {
            id: driverToUpdate.id,
            status: DriverStatus.INACTIVE, // Invalid transition from IN_TRAINING
          };

          // Capture the error to make specific assertions
          let validationError: FieldValidationError | undefined;
          try {
            await updateDriver(updatePayload);
          } catch (error) {
            validationError = error as FieldValidationError;
          }

          // Verify that validation error is thrown
          expect(validationError).toBeDefined();
          const typedValidationError = validationError as FieldValidationError;
          expect(typedValidationError.name).toBe('FieldValidationError');
          expect(typedValidationError.message).toContain('Validation failed');

          // The error should have fieldErrors array with status validation error
          expect(typedValidationError.fieldErrors).toBeDefined();
          expect(Array.isArray(typedValidationError.fieldErrors)).toBe(true);
          expect(typedValidationError.fieldErrors).toHaveLength(1);

          const statusError = typedValidationError.fieldErrors[0];
          expect(statusError.field).toBe('status');
          expect(statusError.code).toBe('INVALID_STATUS');
          expect(statusError.message).toContain('Invalid status transition');
          expect(statusError.message).toContain('in_training');
          expect(statusError.message).toContain('inactive');
          expect(statusError.message).toContain(
            'Valid statuses from "in_training" are: active, probation, terminated',
          );
          expect(statusError.value).toBe(DriverStatus.INACTIVE);
        } finally {
          // Clean up the test driver
          driverCleanup.track(driverToUpdate.id);
        }
      });
    });
  });

  describe('pagination', () => {
    test('should return paginated drivers with default parameters', async () => {
      const response = await listDriversPaginated({});

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBeDefined();
      expect(response.pagination.totalCount).toBeDefined();
      expect(response.pagination.totalPages).toBeDefined();
      expect(typeof response.pagination.hasNextPage).toBe('boolean');
      expect(typeof response.pagination.hasPreviousPage).toBe('boolean');
    });

    test('should honor page and pageSize parameters', async () => {
      const response = await listDriversPaginated({
        page: 1,
        pageSize: 5,
      });

      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
      expect(response.data.length).toBeLessThanOrEqual(5);
    });

    test('should default sort by firstName in ascending order', async () => {
      // Create test drivers with different names for verification of default sorting
      const driverA = await createDriver({
        driverKey: 'AAA001',
        payrollKey: 'PAYAAA001',
        firstName: 'AAA Test',
        lastName: 'Driver',
        email: 'aaa.driver@example.com',
        phone: '5551111111',
        status: DriverStatus.ACTIVE,
        statusDate: new Date(),
        license: 'AAALICENSE',
        licenseExpiry: new Date('2025-01-01'),
        busLineId: createdBusLineId,
      });

      const driverZ = await createDriver({
        driverKey: 'ZZZ001',
        payrollKey: 'PAYZZZ001',
        firstName: 'ZZZ Test',
        lastName: 'Driver',
        email: 'zzz.driver@example.com',
        phone: '5559999999',
        status: DriverStatus.ACTIVE,
        statusDate: new Date(),
        license: 'ZZZLICENSE',
        licenseExpiry: new Date('2025-01-01'),
        busLineId: createdBusLineId,
      });

      try {
        // Get drivers with large enough page size to include test drivers
        const response = await listDriversPaginated({
          pageSize: 50,
        });

        // Find the indices of our test drivers
        const indexA = response.data.findIndex((d) => d.id === driverA.id);
        const indexZ = response.data.findIndex((d) => d.id === driverZ.id);

        // Verify that driverA (AAA) comes before driverZ (ZZZ) in the results
        // This assumes they both appear in the results (which they should with pageSize: 50)
        if (indexA !== -1 && indexZ !== -1) {
          expect(indexA).toBeLessThan(indexZ);
        }
      } finally {
        // Clean up test drivers
        driverCleanup.track(driverA.id);
        driverCleanup.track(driverZ.id);
      }
    });

    test('should return non-paginated list for dropdowns', async () => {
      const response = await listDrivers({});

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      // No pagination info should be present
      expect(response).not.toHaveProperty('pagination');
    });
  });

  describe('search functionality', () => {
    test('should search drivers using searchTerm in list endpoint', async () => {
      // Create a unique driver for search testing
      const searchableDriver = await createDriver({
        driverKey: 'SRCH001',
        payrollKey: 'PAYSRCH001',
        firstName: 'Searchable Test',
        lastName: 'Driver',
        email: 'searchable.driver@example.com',
        phone: '5555555555',
        status: DriverStatus.ACTIVE,
        statusDate: new Date(),
        license: 'SEARCHLICENSE',
        licenseExpiry: new Date('2025-01-01'),
        busLineId: createdBusLineId,
      });

      try {
        // Search for the driver using searchTerm in listDrivers
        const response = await listDrivers({ searchTerm: 'Searchable' });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.some((d) => d.id === searchableDriver.id)).toBe(
          true,
        );
      } finally {
        // Clean up
        driverCleanup.track(searchableDriver.id);
      }
    });

    test('should search drivers with pagination using searchTerm', async () => {
      const response = await listDriversPaginated({
        searchTerm: 'Driver',
        page: 1,
        pageSize: 5,
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
    });

    test('should search in both firstName and lastName', async () => {
      // Create a driver with searchable last name
      const lastNameSearchableDriver = await createDriver({
        driverKey: 'LNSRCH001',
        payrollKey: 'PAYLNSRCH001',
        firstName: 'Normal First',
        lastName: 'SearchableLastName',
        email: 'normal.searchablelastname@example.com',
        phone: '5555554444',
        status: DriverStatus.ACTIVE,
        statusDate: new Date(),
        license: 'LASTNAMELICENSE',
        licenseExpiry: new Date('2025-01-01'),
        busLineId: createdBusLineId,
      });

      try {
        // Search for the keyword that's only in last name
        const response = await listDrivers({
          searchTerm: 'SearchableLastName',
        });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(
          response.data.some((d) => d.id === lastNameSearchableDriver.id),
        ).toBe(true);
      } finally {
        // Clean up
        driverCleanup.track(lastNameSearchableDriver.id);
      }
    });
  });

  describe('ordering and filtering', () => {
    // Test drivers for ordering and filtering tests
    const testDrivers: Driver[] = [];

    beforeAll(async () => {
      // Create test drivers with different properties
      const drivers = [
        {
          driverKey: 'ORDR001',
          payrollKey: 'PAYORDR001',
          firstName: 'Alpha',
          lastName: 'Driver',
          email: 'alpha.driver@example.com',
          phone: '5551234001',
          status: DriverStatus.ACTIVE,
          statusDate: new Date(),
          license: 'ALPHALICENSE',
          licenseExpiry: new Date('2025-12-01'),
          busLineId: createdBusLineId,
        },
        {
          driverKey: 'ORDR002',
          payrollKey: 'PAYORDR002',
          firstName: 'Beta',
          lastName: 'Driver',
          email: 'beta.driver@example.com',
          phone: '5551234002',
          status: DriverStatus.IN_TRAINING,
          statusDate: new Date(),
          license: 'BETALICENSE',
          licenseExpiry: new Date('2025-12-01'),
          busLineId: createdBusLineId,
        },
        {
          driverKey: 'ORDR003',
          payrollKey: 'PAYORDR003',
          firstName: 'Gamma',
          lastName: 'Driver',
          email: 'gamma.driver@example.com',
          phone: '5551234003',
          status: DriverStatus.ACTIVE,
          statusDate: new Date(),
          license: 'GAMMALICENSE',
          licenseExpiry: new Date('2025-12-01'),
          busLineId: createdBusLineId,
        },
      ];

      for (const driver of drivers) {
        const created = await createDriver(driver);
        testDrivers.push(created);
      }
    });

    afterAll(() => {
      // Clean up test drivers using cleanup helper
      for (const driver of testDrivers) {
        driverCleanup.track(driver.id);
      }
    });

    test('should order drivers by firstName descending', async () => {
      const response = await listDrivers({
        orderBy: [{ field: 'firstName', direction: 'desc' }],
      });

      const names = response.data.map((d) => d.firstName);
      // Check if names are in descending order
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] >= names[i + 1]).toBe(true);
      }
    });

    test('should order drivers by lastName in ascending order', async () => {
      const response = await listDrivers({
        orderBy: [{ field: 'lastName', direction: 'asc' }],
      });

      const lastNames = response.data.map((d) => d.lastName);
      // Check if last names are in ascending order
      for (let i = 0; i < lastNames.length - 1; i++) {
        expect(lastNames[i] <= lastNames[i + 1]).toBe(true);
      }
    });

    test('should filter drivers by status', async () => {
      const response = await listDrivers({
        filters: { status: DriverStatus.ACTIVE },
      });

      // All returned drivers should be active
      expect(response.data.every((d) => d.status === DriverStatus.ACTIVE)).toBe(
        true,
      );
      // Should include our active test drivers
      const activeTestDriverIds = testDrivers
        .filter((d) => d.status === DriverStatus.ACTIVE)
        .map((d) => d.id);

      for (const id of activeTestDriverIds) {
        expect(response.data.some((d) => d.id === id)).toBe(true);
      }
    });

    test('should combine ordering and filtering in paginated results', async () => {
      const response = await listDriversPaginated({
        filters: { status: DriverStatus.ACTIVE },
        orderBy: [{ field: 'firstName', direction: 'asc' }],
        page: 1,
        pageSize: 10,
      });

      // Check filtering
      expect(response.data.every((d) => d.status === DriverStatus.ACTIVE)).toBe(
        true,
      );

      // Check ordering (ascending)
      const names = response.data.map((d) => d.firstName);
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] <= names[i + 1]).toBe(true);
      }

      // Check pagination properties
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(10);
    });

    test('should allow multi-field ordering', async () => {
      // Create drivers with same firstName but different lastName
      const sameFirstNameDrivers = [
        {
          driverKey: 'MULT001',
          payrollKey: 'PAYMULT001',
          firstName: 'Same First',
          lastName: 'A',
          email: 'same.a@example.com',
          phone: '5559991001',
          status: DriverStatus.ACTIVE,
          statusDate: new Date(),
          license: 'MULTLICENSE1',
          licenseExpiry: new Date('2025-01-01'),
          busLineId: createdBusLineId,
        },
        {
          driverKey: 'MULT002',
          payrollKey: 'PAYMULT002',
          firstName: 'Same First',
          lastName: 'B',
          email: 'same.b@example.com',
          phone: '5559991002',
          status: DriverStatus.ACTIVE,
          statusDate: new Date(),
          license: 'MULTLICENSE2',
          licenseExpiry: new Date('2025-01-01'),
          busLineId: createdBusLineId,
        },
      ];

      const createdDrivers: Driver[] = [];

      try {
        for (const driver of sameFirstNameDrivers) {
          const created = await createDriver(driver);
          createdDrivers.push(created);
        }

        // Order by firstName first, then by lastName
        const response = await listDrivers({
          orderBy: [
            { field: 'firstName', direction: 'asc' },
            { field: 'lastName', direction: 'asc' },
          ],
        });

        // Get all drivers with the same first name and verify they're ordered by last name
        const sameFirstNameResults = response.data.filter(
          (d) => d.firstName === 'Same First',
        );
        const lastNames = sameFirstNameResults.map((d) => d.lastName);

        for (let i = 0; i < lastNames.length - 1; i++) {
          // Last names should be in ascending order for same first name
          expect(lastNames[i] <= lastNames[i + 1]).toBe(true);
        }
      } finally {
        // Clean up
        for (const driver of createdDrivers) {
          driverCleanup.track(driver.id);
        }
      }
    });
  });

  describe('driver availability', () => {
    // Helper function to generate dynamic dates for tests
    const createTestDates = () => {
      const today = new Date();
      const recentDate = new Date(today);
      recentDate.setDate(today.getDate() - 2); // 2 days ago
      const queryStartDate = new Date(today);
      queryStartDate.setDate(today.getDate() + 7); // Start 7 days from now
      const queryEndDate = new Date(queryStartDate);
      queryEndDate.setDate(queryStartDate.getDate() + 30); // End 30 days later

      return {
        recentCheckDate: recentDate.toISOString().split('T')[0],
        queryStartDate: queryStartDate.toISOString().split('T')[0],
        queryEndDate: queryEndDate.toISOString().split('T')[0],
        timeOffStartOverlap: new Date(
          queryStartDate.getTime() + 5 * 24 * 60 * 60 * 1000,
        )
          .toISOString()
          .split('T')[0], // 5 days after query start
        timeOffEndOverlap: new Date(
          queryStartDate.getTime() + 10 * 24 * 60 * 60 * 1000,
        )
          .toISOString()
          .split('T')[0], // 10 days after query start
        timeOffStartNoOverlap: new Date(
          queryEndDate.getTime() + 5 * 24 * 60 * 60 * 1000,
        )
          .toISOString()
          .split('T')[0], // 5 days after query end
        timeOffEndNoOverlap: new Date(
          queryEndDate.getTime() + 10 * 24 * 60 * 60 * 1000,
        )
          .toISOString()
          .split('T')[0], // 10 days after query end
      };
    };
    test('should handle empty date ranges', async () => {
      const response = await listDriversAvailability({});

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      // Verify availability details are correctly structured
      for (const driver of response.data) {
        expect(typeof driver.isAvailable).toBe('boolean');
        if (driver.availabilityDetails) {
          expect(typeof driver.availabilityDetails.hasValidStatus).toBe(
            'boolean',
          );
          expect(typeof driver.availabilityDetails.hasValidLicense).toBe(
            'boolean',
          );
          expect(typeof driver.availabilityDetails.hasValidMedicalCheck).toBe(
            'boolean',
          );
          expect(typeof driver.availabilityDetails.hasNoTimeOffConflict).toBe(
            'boolean',
          );
        }
      }
    });

    test('should throw validation error when endDate is before startDate', async () => {
      const params = {
        startDate: '2024-12-31',
        endDate: '2024-12-01', // End date before start date
      };

      let validationError: ValidationError | undefined;
      try {
        await listDriversAvailability(params);
      } catch (error) {
        validationError = error as ValidationError;
      }

      expect(validationError).toBeDefined();
      expect(validationError?.name).toBe('ValidationError');
      expect(validationError?.message).toContain(
        'Start date must be before end date',
      );
    });

    describe('availability calculations with medical checks and time-offs', () => {
      let testDriverForAvailability: Driver;

      beforeAll(async () => {
        // Create a driver specifically for availability testing
        testDriverForAvailability = await createDriver({
          ...testDriver,
          driverKey: 'DRV-AVAIL-001',
          payrollKey: 'PAY-AVAIL-001',
          email: 'availability.test@example.com',
          status: DriverStatus.ACTIVE,
          licenseExpiry: '2025-12-31', // Valid license
        });
        driverCleanup.track(testDriverForAvailability.id);
      });

      test('should be available when driver has valid status, license, medical check, and no time-offs', async () => {
        const dates = createTestDates();

        // Create a valid medical check (fit result) - recent check with future expiry
        const medicalCheck = await createDriverMedicalCheck({
          driverId: testDriverForAvailability.id,
          checkDate: dates.recentCheckDate,
          daysUntilNextCheck: 365,
          result: MedicalCheckResult.FIT,
          notes: 'Regular medical check - fit for duty',
        });
        medicalCheckCleanup.track(medicalCheck.id);

        const params = {
          startDate: dates.queryStartDate,
          endDate: dates.queryEndDate,
        };

        const response = await listDriversAvailability(params);
        const driver = response.data.find(
          (d) => d.id === testDriverForAvailability.id,
        );

        expect(driver).toBeDefined();
        expect(driver?.isAvailable).toBe(true);
        expect(driver?.availabilityDetails?.hasValidStatus).toBe(true);
        expect(driver?.availabilityDetails?.hasValidLicense).toBe(true);
        expect(driver?.availabilityDetails?.hasValidMedicalCheck).toBe(true);
        expect(driver?.availabilityDetails?.hasNoTimeOffConflict).toBe(true);
        expect(
          driver?.availabilityDetails?.medicalCheckDetails?.hasMedicalCheck,
        ).toBe(true);
        expect(
          driver?.availabilityDetails?.medicalCheckDetails?.latestResult,
        ).toBe(MedicalCheckResult.FIT);
        expect(
          driver?.availabilityDetails?.medicalCheckDetails?.isCurrent,
        ).toBe(true);
      });

      test('should be unavailable when driver has unfit medical check', async () => {
        // Create a separate driver for this test
        const driverWithUnfitMedical = await createDriver({
          ...testDriver,
          driverKey: 'DRV-UNFIT-001',
          payrollKey: 'PAY-UNFIT-001',
          email: 'unfit.medical@example.com',
          status: DriverStatus.ACTIVE,
          licenseExpiry: '2025-12-31',
        });
        driverCleanup.track(driverWithUnfitMedical.id);

        const dates = createTestDates();

        // Create an unfit medical check (recent but unfit result)
        const medicalCheck = await createDriverMedicalCheck({
          driverId: driverWithUnfitMedical.id,
          checkDate: dates.recentCheckDate,
          daysUntilNextCheck: 365,
          result: MedicalCheckResult.UNFIT,
          notes: 'Medical check - unfit for duty',
        });
        medicalCheckCleanup.track(medicalCheck.id);

        const params = {
          startDate: dates.queryStartDate,
          endDate: dates.queryEndDate,
        };

        const response = await listDriversAvailability(params);
        const driver = response.data.find(
          (d) => d.id === driverWithUnfitMedical.id,
        );

        expect(driver).toBeDefined();
        expect(driver?.isAvailable).toBe(false);
        expect(driver?.availabilityDetails?.hasValidMedicalCheck).toBe(false);
        expect(
          driver?.availabilityDetails?.medicalCheckDetails?.hasMedicalCheck,
        ).toBe(true);
        expect(
          driver?.availabilityDetails?.medicalCheckDetails?.latestResult,
        ).toBe(MedicalCheckResult.UNFIT);
      });

      test('should be available when driver has limited medical check result', async () => {
        // Create a separate driver for this test
        const driverWithLimitedMedical = await createDriver({
          ...testDriver,
          driverKey: 'DRV-LIMITED-001',
          payrollKey: 'PAY-LIMITED-001',
          email: 'limited.medical@example.com',
          status: DriverStatus.ACTIVE,
          licenseExpiry: '2025-12-31',
        });
        driverCleanup.track(driverWithLimitedMedical.id);

        const dates = createTestDates();

        // Create a limited medical check (should still be available)
        const medicalCheck = await createDriverMedicalCheck({
          driverId: driverWithLimitedMedical.id,
          checkDate: dates.recentCheckDate,
          daysUntilNextCheck: 365,
          result: MedicalCheckResult.LIMITED,
          notes: 'Medical check - limited but fit for duty',
        });
        medicalCheckCleanup.track(medicalCheck.id);

        const params = {
          startDate: dates.queryStartDate,
          endDate: dates.queryEndDate,
        };

        const response = await listDriversAvailability(params);
        const driver = response.data.find(
          (d) => d.id === driverWithLimitedMedical.id,
        );

        expect(driver).toBeDefined();
        expect(driver?.isAvailable).toBe(true);
        expect(driver?.availabilityDetails?.hasValidMedicalCheck).toBe(true);
        expect(
          driver?.availabilityDetails?.medicalCheckDetails?.latestResult,
        ).toBe(MedicalCheckResult.LIMITED);
      });

      test('should be unavailable when driver has time-off conflict', async () => {
        // Create a separate driver for this test
        const driverWithTimeOff = await createDriver({
          ...testDriver,
          driverKey: 'DRV-TIME-OFF-001',
          payrollKey: 'PAY-TIME-OFF-001',
          email: 'time.off@example.com',
          status: DriverStatus.ACTIVE,
          licenseExpiry: '2025-12-31',
        });
        driverCleanup.track(driverWithTimeOff.id);

        const dates = createTestDates();

        // Ensure driver has valid medical check
        const medicalCheck = await createDriverMedicalCheck({
          driverId: driverWithTimeOff.id,
          checkDate: dates.recentCheckDate,
          daysUntilNextCheck: 365,
          result: MedicalCheckResult.FIT,
          notes: 'Valid medical check',
        });
        medicalCheckCleanup.track(medicalCheck.id);

        // Create a time-off that overlaps with the query period
        const timeOff = await createDriverTimeOff({
          driverId: driverWithTimeOff.id,
          startDate: dates.timeOffStartOverlap,
          endDate: dates.timeOffEndOverlap,
          type: TimeOffType.VACATION,
          reason: 'Annual vacation',
        });
        timeOffCleanup.track(timeOff.id);

        const params = {
          startDate: dates.queryStartDate,
          endDate: dates.queryEndDate,
        };

        const response = await listDriversAvailability(params);
        const driver = response.data.find((d) => d.id === driverWithTimeOff.id);

        expect(driver).toBeDefined();
        expect(driver?.isAvailable).toBe(false);
        expect(driver?.availabilityDetails?.hasNoTimeOffConflict).toBe(false);
        expect(driver?.availabilityDetails?.hasValidMedicalCheck).toBe(true);
        expect(driver?.availabilityDetails?.hasValidStatus).toBe(true);
        expect(driver?.availabilityDetails?.hasValidLicense).toBe(true);
      });

      test('should be available when time-off does not overlap with query period', async () => {
        // Create a new driver specifically for this test to avoid interference from other tests
        const driverForNonOverlapTest = await createDriver({
          ...testDriver,
          driverKey: 'DRV-NON-OVERLAP-001',
          payrollKey: 'PAY-NON-OVERLAP-001',
          email: 'non.overlap@example.com',
          status: DriverStatus.ACTIVE,
          licenseExpiry: '2025-12-31', // Valid license
        });
        driverCleanup.track(driverForNonOverlapTest.id);

        const dates = createTestDates();

        // Create valid medical check
        const medicalCheck = await createDriverMedicalCheck({
          driverId: driverForNonOverlapTest.id,
          checkDate: dates.recentCheckDate,
          daysUntilNextCheck: 365,
          result: MedicalCheckResult.FIT,
          notes: 'Valid medical check',
        });
        medicalCheckCleanup.track(medicalCheck.id);

        // Create a time-off that does NOT overlap with the query period (after the query)
        const timeOff = await createDriverTimeOff({
          driverId: driverForNonOverlapTest.id,
          startDate: dates.timeOffStartNoOverlap,
          endDate: dates.timeOffEndNoOverlap,
          type: TimeOffType.PERSONAL_DAY,
          reason: 'Personal matters',
        });
        timeOffCleanup.track(timeOff.id);

        const params = {
          startDate: dates.queryStartDate,
          endDate: dates.queryEndDate,
        };

        const response = await listDriversAvailability(params);
        const driver = response.data.find(
          (d) => d.id === driverForNonOverlapTest.id,
        );

        expect(driver).toBeDefined();
        expect(driver?.isAvailable).toBe(true);
        expect(driver?.availabilityDetails?.hasNoTimeOffConflict).toBe(true);
        expect(driver?.availabilityDetails?.hasValidMedicalCheck).toBe(true);
      });

      test('should be unavailable when driver has no medical check', async () => {
        // Create a driver without any medical checks
        const driverWithoutMedical = await createDriver({
          ...testDriver,
          driverKey: 'DRV-NO-MED-001',
          payrollKey: 'PAY-NO-MED-001',
          email: 'no.medical@example.com',
          status: DriverStatus.ACTIVE,
          licenseExpiry: '2025-12-31',
        });
        driverCleanup.track(driverWithoutMedical.id);

        const dates = createTestDates();
        const params = {
          startDate: dates.queryStartDate,
          endDate: dates.queryEndDate,
        };

        const response = await listDriversAvailability(params);
        const driver = response.data.find(
          (d) => d.id === driverWithoutMedical.id,
        );

        expect(driver).toBeDefined();
        expect(driver?.isAvailable).toBe(false);
        expect(driver?.availabilityDetails?.hasValidMedicalCheck).toBe(false);
        expect(
          driver?.availabilityDetails?.medicalCheckDetails?.hasMedicalCheck,
        ).toBe(false);
        expect(
          driver?.availabilityDetails?.medicalCheckDetails?.latestResult,
        ).toBeNull();
      });

      test('should be unavailable when driver has expired license', async () => {
        // Create a driver with expired license
        const driverWithExpiredLicense = await createDriver({
          ...testDriver,
          driverKey: 'DRV-EXP-LIC-001',
          payrollKey: 'PAY-EXP-LIC-001',
          email: 'expired.license@example.com',
          status: DriverStatus.ACTIVE,
          licenseExpiry: '2024-06-01', // Expired license
        });
        driverCleanup.track(driverWithExpiredLicense.id);

        const dates = createTestDates();

        // Create valid medical check
        const medicalCheck = await createDriverMedicalCheck({
          driverId: driverWithExpiredLicense.id,
          checkDate: dates.recentCheckDate,
          daysUntilNextCheck: 365,
          result: MedicalCheckResult.FIT,
          notes: 'Valid medical check',
        });
        medicalCheckCleanup.track(medicalCheck.id);

        const params = {
          startDate: dates.queryStartDate,
          endDate: dates.queryEndDate,
        };

        const response = await listDriversAvailability(params);
        const driver = response.data.find(
          (d) => d.id === driverWithExpiredLicense.id,
        );

        expect(driver).toBeDefined();
        expect(driver?.isAvailable).toBe(false);
        expect(driver?.availabilityDetails?.hasValidLicense).toBe(false);
        expect(driver?.availabilityDetails?.hasValidMedicalCheck).toBe(true);
        expect(driver?.availabilityDetails?.hasValidStatus).toBe(true);
      });

      test('should be unavailable when driver has expired medical check', async () => {
        // Create a driver with expired medical check
        const driverWithExpiredMedical = await createDriver({
          ...testDriver,
          driverKey: 'DRV-EXP-MED-001',
          payrollKey: 'PAY-EXP-MED-001',
          email: 'expired.medical@example.com',
          status: DriverStatus.ACTIVE,
          licenseExpiry: '2025-12-31',
        });
        driverCleanup.track(driverWithExpiredMedical.id);

        // Create an expired medical check (nextCheckDate in the past)
        const medicalCheck = await createDriverMedicalCheck({
          driverId: driverWithExpiredMedical.id,
          checkDate: '2024-01-01',
          daysUntilNextCheck: 30, // Only 30 days validity, so expired by now
          result: MedicalCheckResult.FIT,
          notes: 'Expired medical check',
        });
        medicalCheckCleanup.track(medicalCheck.id);

        const dates = createTestDates();
        const params = {
          startDate: dates.queryStartDate,
          endDate: dates.queryEndDate,
        };

        const response = await listDriversAvailability(params);
        const driver = response.data.find(
          (d) => d.id === driverWithExpiredMedical.id,
        );

        expect(driver).toBeDefined();
        expect(driver?.isAvailable).toBe(false);
        expect(driver?.availabilityDetails?.hasValidMedicalCheck).toBe(false);
        expect(
          driver?.availabilityDetails?.medicalCheckDetails?.hasMedicalCheck,
        ).toBe(true);
        expect(
          driver?.availabilityDetails?.medicalCheckDetails?.latestResult,
        ).toBe(MedicalCheckResult.FIT);
        expect(
          driver?.availabilityDetails?.medicalCheckDetails?.isCurrent,
        ).toBe(false);
        expect(driver?.availabilityDetails?.hasValidStatus).toBe(true);
        expect(driver?.availabilityDetails?.hasValidLicense).toBe(true);
      });

      test('should be unavailable when driver has invalid status', async () => {
        // Create a driver with valid initial status, then update to invalid status
        const driverWithInvalidStatus = await createDriver({
          ...testDriver,
          driverKey: 'DRV-INV-STATUS-001',
          payrollKey: 'PAY-INV-STATUS-001',
          email: 'invalid.status@example.com',
          status: DriverStatus.ACTIVE, // Valid initial status
          licenseExpiry: '2025-12-31',
        });
        driverCleanup.track(driverWithInvalidStatus.id);

        // Update to an invalid status for availability (using repository to bypass validation)
        await driverRepository.update(driverWithInvalidStatus.id, {
          status: DriverStatus.SUSPENDED,
        });

        const dates = createTestDates();

        // Create valid medical check
        const medicalCheck = await createDriverMedicalCheck({
          driverId: driverWithInvalidStatus.id,
          checkDate: dates.recentCheckDate,
          daysUntilNextCheck: 365,
          result: MedicalCheckResult.FIT,
          notes: 'Valid medical check',
        });
        medicalCheckCleanup.track(medicalCheck.id);

        const params = {
          startDate: dates.queryStartDate,
          endDate: dates.queryEndDate,
        };

        const response = await listDriversAvailability(params);
        const driver = response.data.find(
          (d) => d.id === driverWithInvalidStatus.id,
        );

        expect(driver).toBeDefined();
        expect(driver?.isAvailable).toBe(false);
        expect(driver?.availabilityDetails?.hasValidStatus).toBe(false);
        expect(driver?.availabilityDetails?.currentStatus).toBe(
          DriverStatus.SUSPENDED,
        );
        expect(driver?.availabilityDetails?.hasValidMedicalCheck).toBe(true);
        expect(driver?.availabilityDetails?.hasValidLicense).toBe(true);
      });
    });
  });
});
