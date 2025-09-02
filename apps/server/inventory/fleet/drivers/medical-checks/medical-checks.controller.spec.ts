import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { NotFoundError } from '@repo/base-repo';
import { busLineRepository } from '@/inventory/operators/bus-lines/bus-lines.repository';
import { serviceTypeRepository } from '@/inventory/operators/service-types/service-types.repository';
import { ServiceTypeCategory } from '@/inventory/operators/service-types/service-types.types';
import { transporterRepository } from '@/inventory/operators/transporters/transporters.repository';
import { createCleanupHelper } from '@/tests/shared/test-utils';
import { driverRepository } from '../drivers.repository';
import { DriverStatus } from '../drivers.types';
import { MedicalCheckResult, MedicalCheckSource } from './medical-checks.types';
import { driverMedicalCheckRepository } from './medical-checks.repository';
import {
  createDriverMedicalCheck,
  getDriverMedicalCheck,
  listDriverMedicalChecks,
  listDriverMedicalChecksPaginated,
} from './medical-checks.controller';

describe('Driver Medical Checks Controller', () => {
  // Test data and setup
  const testDriver = {
    driverKey: 'DRV-MED-001',
    payrollKey: 'PAY-MED-001',
    firstName: 'John',
    lastName: 'Doe',
    address: '123 Main St, Downtown, Mexico City, CDMX, 12345',
    phone: '+52 55 12345678',
    email: 'john.doe.medical@example.com',
    hireDate: '2020-01-15',
    status: DriverStatus.ACTIVE,
    statusDate: '2020-01-15',
    license: 'LIC-MED-12345',
    licenseExpiry: '2026-01-15',
    transporterId: 0, // Will be set in beforeAll
    busLineId: 0, // Will be set in beforeAll
    emergencyContactName: 'John Doe',
    emergencyContactPhone: '+52 33 1234 5678',
    emergencyContactRelationship: 'Father',
  };

  // Cleanup helpers
  const medicalCheckCleanup = createCleanupHelper(
    ({ id }) => driverMedicalCheckRepository.forceDelete(id),
    'medicalCheck',
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
        name: 'Test Service Type for Medical Checks',
        code: 'TSTSTD-MED',
        category: ServiceTypeCategory.REGULAR,
        description: 'Test service type for driver medical check relations',
        active: true,
      });
      createdServiceTypeId = testServiceType.id;
      serviceTypeCleanup.track(testServiceType.id);

      // Create test transporter
      const testTransporter = await transporterRepository.create({
        name: 'Test Transporter for Medical Checks',
        code: 'TST001-MED',
        description: 'Test transporter for driver medical check relations',
        contactInfo: 'test.medical@transporter.com',
        licenseNumber: 'LIC001-MED',
        active: true,
      });
      createdTransporterId = testTransporter.id;
      transporterCleanup.track(testTransporter.id);

      // Create test bus line
      const testBusLine = await busLineRepository.create({
        name: 'Test Bus Line for Medical Checks',
        code: 'BL001-MED',
        transporterId: createdTransporterId,
        serviceTypeId: createdServiceTypeId,
        description: 'Test bus line for driver medical check relations',
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
    // 1. medical checks (referenced by drivers)
    await medicalCheckCleanup.cleanupAll();
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
    test('should create a new medical check for a driver', async () => {
      // Create a test driver first
      const driver = await driverRepository.create(testDriver);
      createdDriverId = driver.id;
      driverCleanup.track(createdDriverId);

      const medicalCheckData = {
        driverId: driver.id,
        checkDate: '2024-12-01',
        daysUntilNextCheck: 365,
        result: MedicalCheckResult.FIT,
        notes: 'Regular annual medical check',
      };

      const response = await createDriverMedicalCheck(medicalCheckData);
      medicalCheckCleanup.track(response.id);

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.driverId).toBe(driver.id);
      expect(response.checkDate).toBe(medicalCheckData.checkDate);
      expect(response.daysUntilNextCheck).toBe(
        medicalCheckData.daysUntilNextCheck,
      );
      expect(response.result).toBe(medicalCheckData.result);
      expect(response.notes).toBe(medicalCheckData.notes);
      expect(response.source).toBe(MedicalCheckSource.MANUAL);
      expect(response.createdAt).toBeDefined();
      expect(response.updatedAt).toBeDefined();
      expect(response.nextCheckDate).toBeDefined();

      // Test edge case: medical check without notes
      const minimalMedicalCheck = await createDriverMedicalCheck({
        driverId: driver.id,
        checkDate: '2024-12-10',
        daysUntilNextCheck: 180,
        result: MedicalCheckResult.LIMITED,
      });
      medicalCheckCleanup.track(minimalMedicalCheck.id);

      expect(minimalMedicalCheck).toBeDefined();
      expect(minimalMedicalCheck.notes).toBeNull();
      expect(minimalMedicalCheck.result).toBe(MedicalCheckResult.LIMITED);
    });

    test('should retrieve a medical check by ID', async () => {
      // Create a test driver
      const driver = await driverRepository.create({
        ...testDriver,
        driverKey: 'DRV-MED-002',
        payrollKey: 'PAY-MED-002',
        email: 'john.doe.medical2@example.com',
      });
      driverCleanup.track(driver.id);

      // Create a medical check
      const medicalCheckData = {
        driverId: driver.id,
        checkDate: '2024-12-10',
        daysUntilNextCheck: 90,
        result: MedicalCheckResult.FIT,
        notes: 'Semi-annual medical check',
      };

      const created = await createDriverMedicalCheck(medicalCheckData);
      medicalCheckCleanup.track(created.id);

      // Retrieve it
      const response = await getDriverMedicalCheck({
        driverId: driver.id,
        id: created.id,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(created.id);
      expect(response.driverId).toBe(driver.id);
      expect(response.result).toBe(medicalCheckData.result);
      expect(response.checkDate).toBe(medicalCheckData.checkDate);
      expect(response.daysUntilNextCheck).toBe(
        medicalCheckData.daysUntilNextCheck,
      );
    });

    test('should list all medical checks for a driver', async () => {
      // Create a test driver
      const driver = await driverRepository.create({
        ...testDriver,
        driverKey: 'DRV-MED-003',
        payrollKey: 'PAY-MED-003',
        email: 'john.doe.medical3@example.com',
      });
      driverCleanup.track(driver.id);

      // Create multiple medical checks
      const medicalCheck1 = await createDriverMedicalCheck({
        driverId: driver.id,
        checkDate: '2024-06-01',
        daysUntilNextCheck: 365,
        result: MedicalCheckResult.FIT,
        notes: 'Annual medical check',
      });
      medicalCheckCleanup.track(medicalCheck1.id);

      const medicalCheck2 = await createDriverMedicalCheck({
        driverId: driver.id,
        checkDate: '2024-12-01',
        daysUntilNextCheck: 180,
        result: MedicalCheckResult.LIMITED,
        notes: 'Follow-up medical check',
      });
      medicalCheckCleanup.track(medicalCheck2.id);

      // List all
      const response = await listDriverMedicalChecks({
        driverId: driver.id,
      });

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThanOrEqual(2);

      // Should include our created medical checks
      const foundIds = response.data.map((medicalCheck) => medicalCheck.id);
      expect(foundIds).toContain(medicalCheck1.id);
      expect(foundIds).toContain(medicalCheck2.id);
    });

    test('should list medical checks with pagination', async () => {
      // Create a test driver
      const driver = await driverRepository.create({
        ...testDriver,
        driverKey: 'DRV-MED-004',
        payrollKey: 'PAY-MED-004',
        email: 'john.doe.medical4@example.com',
      });
      driverCleanup.track(driver.id);

      const response = await listDriverMedicalChecksPaginated({
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

    test('should create a medical check with Date objects and ISO strings', async () => {
      // Create a test driver
      const driver = await driverRepository.create({
        ...testDriver,
        driverKey: 'DRV-MED-005',
        payrollKey: 'PAY-MED-005',
        email: 'john.doe.medical5@example.com',
      });
      driverCleanup.track(driver.id);

      // Test 1: ISO string date (covers "other string format" path in domain)
      const isoStringCheckDate = '2025-01-15T01:30:00.000Z';
      const medicalCheckISO = await createDriverMedicalCheck({
        driverId: driver.id,
        checkDate: isoStringCheckDate,
        daysUntilNextCheck: 365,
        result: MedicalCheckResult.FIT,
        notes: 'Medical check with ISO string',
      });
      medicalCheckCleanup.track(medicalCheckISO.id);

      expect(medicalCheckISO).toBeDefined();
      expect(medicalCheckISO.checkDate).toBe('2025-01-15');
      expect(medicalCheckISO.notes).toBe('Medical check with ISO string');

      // Test 2: Date object (covers Date object path in domain)
      const dateObjectCheckDate = new Date(2025, 0, 20, 0, 0, 0, 0);
      const medicalCheckDate = await createDriverMedicalCheck({
        driverId: driver.id,
        checkDate: dateObjectCheckDate,
        daysUntilNextCheck: 180,
        result: MedicalCheckResult.LIMITED,
        notes: 'Medical check with Date object',
      });
      medicalCheckCleanup.track(medicalCheckDate.id);

      expect(medicalCheckDate).toBeDefined();
      expect(medicalCheckDate.checkDate).toBe('2025-01-20');
      expect(medicalCheckDate.notes).toBe('Medical check with Date object');
    });

    test('should create medical checks with different results', async () => {
      // Create a test driver
      const driver = await driverRepository.create({
        ...testDriver,
        driverKey: 'DRV-MED-006',
        payrollKey: 'PAY-MED-006',
        email: 'john.doe.medical6@example.com',
      });
      driverCleanup.track(driver.id);

      // Test all medical check results
      const results: MedicalCheckResult[] = [
        MedicalCheckResult.FIT,
        MedicalCheckResult.LIMITED,
        MedicalCheckResult.UNFIT,
      ];

      for (const result of results) {
        const medicalCheck = await createDriverMedicalCheck({
          driverId: driver.id,
          checkDate: '2024-12-15',
          daysUntilNextCheck: 30,
          result,
          notes: `Medical check result: ${result}`,
        });
        medicalCheckCleanup.track(medicalCheck.id);

        expect(medicalCheck.result).toBe(result);
        expect(medicalCheck.notes).toBe(`Medical check result: ${result}`);
      }
    });
  });

  describe('error scenarios', () => {
    test('should handle driver not found errors', async () => {
      await expect(
        createDriverMedicalCheck({
          driverId: 99999,
          checkDate: '2024-12-01',
          daysUntilNextCheck: 365,
          result: MedicalCheckResult.FIT,
        }),
      ).rejects.toThrow();
    });

    test('should handle medical check not found errors', async () => {
      await expect(
        getDriverMedicalCheck({
          driverId: createdDriverId,
          id: 99999,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    test('should handle medical check belonging to different driver', async () => {
      // Create a test driver
      const driver = await driverRepository.create({
        ...testDriver,
        driverKey: 'DRV-MED-007',
        payrollKey: 'PAY-MED-007',
        email: 'john.doe.medical7@example.com',
      });
      driverCleanup.track(driver.id);

      // Create a medical check
      const medicalCheck = await createDriverMedicalCheck({
        driverId: driver.id,
        checkDate: '2024-12-01',
        daysUntilNextCheck: 365,
        result: MedicalCheckResult.FIT,
        notes: 'Test medical check',
      });
      medicalCheckCleanup.track(medicalCheck.id);

      // Try to access it with a different driver ID
      await expect(
        getDriverMedicalCheck({
          driverId: 99999,
          id: medicalCheck.id,
        }),
      ).rejects.toThrow();
    });
  });

  describe('pagination and listing', () => {
    let testDriverForListing: number;

    beforeAll(async () => {
      // Create a test driver for pagination tests
      const driver = await driverRepository.create({
        ...testDriver,
        driverKey: 'DRV-MED-PAGINATION',
        payrollKey: 'PAY-MED-PAGINATION',
        email: 'john.doe.pagination@example.com',
      });
      testDriverForListing = driver.id;
      driverCleanup.track(testDriverForListing);

      // Create several test medical checks
      const medicalChecks = [
        {
          checkDate: '2024-01-01',
          daysUntilNextCheck: 365,
          result: MedicalCheckResult.FIT,
        },
        {
          checkDate: '2024-06-01',
          daysUntilNextCheck: 180,
          result: MedicalCheckResult.LIMITED,
        },
        {
          checkDate: '2024-12-01',
          daysUntilNextCheck: 90,
          result: MedicalCheckResult.UNFIT,
        },
      ];

      for (const medicalCheck of medicalChecks) {
        const created = await createDriverMedicalCheck({
          driverId: testDriverForListing,
          ...medicalCheck,
          notes: `Test ${medicalCheck.result} medical check`,
        });
        medicalCheckCleanup.track(created.id);
      }
    });

    test('should handle both paginated and non-paginated listing', async () => {
      // Test paginated response
      const paginatedResponse = await listDriverMedicalChecksPaginated({
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
      const nonPaginatedResponse = await listDriverMedicalChecks({
        driverId: testDriverForListing,
      });

      expect(nonPaginatedResponse.data).toBeDefined();
      expect(Array.isArray(nonPaginatedResponse.data)).toBe(true);
      expect(nonPaginatedResponse.data.length).toBeGreaterThanOrEqual(3);
      expect(nonPaginatedResponse).not.toHaveProperty('pagination');
    });

    test('should support filtering and ordering', async () => {
      // Test filtering by result
      const filteredResponse = await listDriverMedicalChecks({
        driverId: testDriverForListing,
        filters: { result: MedicalCheckResult.FIT },
      });

      expect(
        filteredResponse.data.every(
          (medicalCheck) => medicalCheck.result === MedicalCheckResult.FIT,
        ),
      ).toBe(true);

      // Test ordering with pagination
      const orderedResponse = await listDriverMedicalChecksPaginated({
        driverId: testDriverForListing,
        orderBy: [{ field: 'checkDate', direction: 'asc' }],
        pageSize: 10,
      });

      const checkDates = orderedResponse.data.map(
        (mc) => new Date(mc.checkDate),
      );
      for (let i = 0; i < checkDates.length - 1; i++) {
        expect(checkDates[i] <= checkDates[i + 1]).toBe(true);
      }
    });
  });
});
