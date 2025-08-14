import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import {
  createServiceType,
  deleteServiceType,
} from '@/inventory/operators/service-types/service-types.controller';
import { ServiceTypeCategory } from '@/inventory/operators/service-types/service-types.types';
import {
  createTransporter,
  deleteTransporter,
} from '@/inventory/operators/transporters/transporters.controller';
import type { BusLine } from './bus-lines.types';
import {
  createBusLine,
  deleteBusLine,
  getBusLine,
  listBusLines,
  listBusLinesPaginated,
  updateBusLine,
} from './bus-lines.controller';

describe('Bus Lines Controller', () => {
  // Test data and setup
  let transporterId: number;
  let serviceTypeId: number;

  const testBusLine = {
    name: 'Test Bus Line',
    code: 'TBL-01',
    description: 'Test bus line description',
    transporterId: 0, // Will be populated in beforeAll
    serviceTypeId: 0, // Will be populated in beforeAll
    active: true,
    pricePerKilometer: 2,
    fleetSize: 25,
    website: 'https://testbusline.com',
    email: 'info@testbusline.com',
    phone: '+1-555-0123',
  };

  // Variables to store created IDs for cleanup
  let createdBusLineId: number;
  // Array to track additional bus lines created in tests
  let additionalBusLineIds: number[] = [];

  // Setup test dependencies - create transporter and service type
  beforeAll(async () => {
    // Create a temporary transporter
    const transporter = await createTransporter({
      name: 'Test Transporter for Bus Lines',
      code: 'TTB',
      description: 'Test transporter for bus lines tests',
      active: true,
    });
    transporterId = transporter.id;
    testBusLine.transporterId = transporterId;

    // Create a temporary service type
    const serviceType = await createServiceType({
      name: 'Test Service Type for Bus Lines',
      code: 'TSTBL',
      category: ServiceTypeCategory.REGULAR,
      description: 'Test service type for bus lines tests',
      active: true,
    });
    serviceTypeId = serviceType.id;
    testBusLine.serviceTypeId = serviceTypeId;
  });

  // Clean up after all tests
  afterAll(async () => {
    // Clean up any additional bus lines created during tests
    for (const id of additionalBusLineIds) {
      try {
        await deleteBusLine({ id });
      } catch {
        // Silent error handling for cleanup
      }
    }

    // Clean up the main created bus line if any
    if (createdBusLineId) {
      try {
        await deleteBusLine({ id: createdBusLineId });
      } catch {
        // Silent error handling for cleanup
      }
    }

    // Clean up the created service type
    if (serviceTypeId) {
      try {
        await deleteServiceType({ id: serviceTypeId });
      } catch {
        // Silent error handling for cleanup
      }
    }

    // Clean up the created transporter
    if (transporterId) {
      try {
        await deleteTransporter({ id: transporterId });
      } catch {
        // Silent error handling for cleanup
      }
    }
  });

  describe('success scenarios', () => {
    test('should create a new bus line', async () => {
      // Create a new bus line
      const response = await createBusLine(testBusLine);

      // Store the ID for later cleanup
      createdBusLineId = response.id;

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(testBusLine.name);
      expect(response.code).toBe(testBusLine.code);
      expect(response.description).toBe(testBusLine.description);
      expect(response.transporterId).toBe(testBusLine.transporterId);
      expect(response.serviceTypeId).toBe(testBusLine.serviceTypeId);
      expect(response.active).toBe(testBusLine.active);
      expect(response.createdAt).toBeDefined();
    });

    test('should create a bus line with minimal required fields', async () => {
      // Create a bus line with just the required fields
      const busLineWithMinimalFields = await createBusLine({
        name: 'Minimal Bus Line',
        code: 'MINIMAL-01',
        transporterId: transporterId,
        serviceTypeId: serviceTypeId,
      });

      // Add to list of bus lines to clean up
      additionalBusLineIds.push(busLineWithMinimalFields.id);

      // Assertions
      expect(busLineWithMinimalFields).toBeDefined();
      expect(busLineWithMinimalFields.id).toBeDefined();
      expect(busLineWithMinimalFields.name).toBe('Minimal Bus Line');
      expect(busLineWithMinimalFields.code).toBe('MINIMAL-01');
      expect(busLineWithMinimalFields.transporterId).toBe(transporterId);
      expect(busLineWithMinimalFields.serviceTypeId).toBe(serviceTypeId);
      // Should have default values for optional fields
      expect(busLineWithMinimalFields.active).toBe(true);
      expect(busLineWithMinimalFields.pricePerKilometer).toBe(1); // Default value
      // Optional fields should be null when not provided
      expect(busLineWithMinimalFields.description).toBeNull();
      expect(busLineWithMinimalFields.fleetSize).toBeNull();
      expect(busLineWithMinimalFields.website).toBeNull();
      expect(busLineWithMinimalFields.email).toBeNull();
      expect(busLineWithMinimalFields.phone).toBeNull();

      // Clean up
      await deleteBusLine({ id: busLineWithMinimalFields.id });
      // Remove from cleanup list since we just deleted it
      additionalBusLineIds = additionalBusLineIds.filter(
        (id) => id !== busLineWithMinimalFields.id,
      );
    });

    test('should retrieve a bus line by ID', async () => {
      const response = await getBusLine({ id: createdBusLineId });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdBusLineId);
      expect(response.name).toBe(testBusLine.name);
      expect(response.code).toBe(testBusLine.code);
      expect(response.description).toBe(testBusLine.description);
      expect(response.transporterId).toBe(testBusLine.transporterId);
      expect(response.serviceTypeId).toBe(testBusLine.serviceTypeId);
      expect(response.pricePerKilometer).toBe(testBusLine.pricePerKilometer);
      expect(response.fleetSize).toBe(testBusLine.fleetSize);
      expect(response.website).toBe(testBusLine.website);
      expect(response.email).toBe(testBusLine.email);
      expect(response.phone).toBe(testBusLine.phone);
      expect(response.active).toBe(testBusLine.active);
    });

    test('should list all bus lines', async () => {
      const result = await listBusLines({});

      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      // Verify our test bus line is in the list
      expect(
        result.data.some((busLine) => busLine.id === createdBusLineId),
      ).toBe(true);
    });

    test('should list bus lines with custom query options', async () => {
      const result = await listBusLines({
        filters: { active: true },
        orderBy: [{ field: 'name', direction: 'asc' }],
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.every((busLine) => busLine.active === true)).toBe(
        true,
      );
    });

    test('should retrieve paginated bus lines', async () => {
      const result = await listBusLinesPaginated({ page: 1, pageSize: 10 });

      // Check the structure of the response
      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination).toBeDefined();
      expect(typeof result.pagination.currentPage).toBe('number');
      expect(typeof result.pagination.pageSize).toBe('number');
      expect(typeof result.pagination.totalCount).toBe('number');
      expect(typeof result.pagination.totalPages).toBe('number');
      expect(typeof result.pagination.hasNextPage).toBe('boolean');
      expect(typeof result.pagination.hasPreviousPage).toBe('boolean');

      // We should at least find our test bus line
      expect(
        result.data.some((busLine) => busLine.id === createdBusLineId),
      ).toBe(true);

      // Pagination values should make sense
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.pageSize).toBe(10);
      expect(result.pagination.totalCount).toBeGreaterThanOrEqual(1);
    });

    test('pagination should respect pageSize parameter for bus lines', async () => {
      // Request with a small page size
      const result = await listBusLinesPaginated({ page: 1, pageSize: 1 });

      expect(result.data.length).toBeLessThanOrEqual(1);
      expect(result.pagination.pageSize).toBe(1);
    });

    test('should update a bus line', async () => {
      const updatedName = 'Updated Test Bus Line';
      const updatedDescription = 'Updated test bus line description';
      const updatedPricePerKm = 3;

      const response = await updateBusLine({
        id: createdBusLineId,
        name: updatedName,
        description: updatedDescription,
        pricePerKilometer: updatedPricePerKm,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdBusLineId);
      expect(response.name).toBe(updatedName);
      expect(response.description).toBe(updatedDescription);
      expect(response.pricePerKilometer).toBe(updatedPricePerKm);
      // Other fields should remain unchanged
      expect(response.code).toBe(testBusLine.code);
      expect(response.transporterId).toBe(testBusLine.transporterId);
      expect(response.serviceTypeId).toBe(testBusLine.serviceTypeId);
    });

    test('should delete a bus line', async () => {
      // Create a bus line specifically for deletion test
      const busLineToDelete = await createBusLine({
        name: 'Bus Line To Delete',
        code: 'DEL-BL',
        description: 'Bus line to be deleted',
        transporterId: transporterId,
        serviceTypeId: serviceTypeId,
        pricePerKilometer: 2,
        fleetSize: 10,
        website: 'https://temporary.com',
        email: 'temp@temporary.com',
        phone: '+1-555-0000',
        active: true,
      });

      // Delete should not throw an error
      await expect(
        deleteBusLine({ id: busLineToDelete.id }),
      ).resolves.not.toThrow();

      // Attempt to get should throw a not found error
      await expect(getBusLine({ id: busLineToDelete.id })).rejects.toThrow();
    });
  });

  describe('error scenarios', () => {
    // NOTE: We are not testing the validation errors because it's handled by Encore rust runtime and they are not thrown in the controller

    test('should handle not found errors', async () => {
      await expect(getBusLine({ id: 9999 })).rejects.toThrow();
    });

    test('should handle duplicate errors', async () => {
      // Try to create bus line with same code as existing one
      await expect(
        createBusLine({
          name: 'Another Test Bus Line',
          code: testBusLine.code, // Using the same code as our main test bus line
          description: 'Another description',
          transporterId: transporterId,
          serviceTypeId: serviceTypeId,
          active: true,
        }),
      ).rejects.toThrow();
    });

    test('should handle invalid transporter ID', async () => {
      // Try to create a bus line with a non-existent transporter ID
      await expect(
        createBusLine({
          name: 'Invalid Transporter Bus Line',
          code: 'INV-TRNSP',
          description: 'Invalid transporter test',
          transporterId: 9999, // Non-existent transporter ID
          serviceTypeId: serviceTypeId,
          active: true,
        }),
      ).rejects.toThrow();
    });

    test('should handle invalid service type ID', async () => {
      // Try to create a bus line with a non-existent service type ID
      await expect(
        createBusLine({
          name: 'Invalid Service Type Bus Line',
          code: 'INV-SRVC',
          description: 'Invalid service type test',
          transporterId: transporterId,
          serviceTypeId: 9999, // Non-existent service type ID
          active: true,
        }),
      ).rejects.toThrow();
    });
  });

  describe('ordering and filtering', () => {
    const testBusLines: BusLine[] = [];

    beforeAll(async () => {
      const busLines = [
        {
          name: 'Alpha Bus Line',
          code: 'ALPHA-BL',
          description: 'Alpha bus line description',
          transporterId,
          serviceTypeId,
          pricePerKilometer: 1,
          fleetSize: 20,
          website: 'https://alpha.com',
          email: 'alpha@test.com',
          phone: '+1-555-4444',
          active: true,
        },
        {
          name: 'Beta Bus Line',
          code: 'BETA-BL',
          description: 'Beta bus line description',
          transporterId,
          serviceTypeId,
          pricePerKilometer: 2,
          fleetSize: 15,
          website: 'https://beta.com',
          email: 'beta@test.com',
          phone: '+1-555-5555',
          active: false,
        },
        {
          name: 'Gamma Bus Line',
          code: 'GAMMA-BL',
          description: 'Gamma bus line description',
          transporterId,
          serviceTypeId,
          pricePerKilometer: 2,
          fleetSize: 30,
          website: 'https://gamma.com',
          email: 'gamma@test.com',
          phone: '+1-555-6666',
          active: true,
        },
      ];

      for (const busLine of busLines) {
        const created = await createBusLine(busLine);
        testBusLines.push(created);
        additionalBusLineIds.push(created.id);
      }
    });

    afterAll(async () => {
      for (const id of testBusLines.map((bl) => bl.id)) {
        try {
          await deleteBusLine({ id });
        } catch (error) {
          console.error(`Error deleting test bus line ${id}:`, error);
        }
      }
    });

    test('should order bus lines by name descending', async () => {
      const response = await listBusLines({
        orderBy: [{ field: 'name', direction: 'desc' }],
      });

      const names = response.data.map((bl) => bl.name);

      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] >= names[i + 1]).toBe(true);
      }
    });

    test('should filter bus lines by active status', async () => {
      const response = await listBusLines({
        filters: { active: true },
      });

      expect(response.data.every((bl) => bl.active === true)).toBe(true);

      const activeTestBusLineIds = testBusLines
        .filter((bl) => bl.active)
        .map((bl) => bl.id);

      for (const id of activeTestBusLineIds) {
        expect(response.data.some((bl) => bl.id === id)).toBe(true);
      }
    });

    test('should combine ordering and filtering in paginated results', async () => {
      const response = await listBusLinesPaginated({
        filters: { active: true },
        orderBy: [{ field: 'name', direction: 'asc' }],
        page: 1,
        pageSize: 10,
      });

      expect(response.data.every((bl) => bl.active === true)).toBe(true);

      const names = response.data.map((bl) => bl.name);
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] <= names[i + 1]).toBe(true);
      }

      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(10);
    });

    test('should allow multi-field ordering', async () => {
      const sameActiveStatusBusLines = [
        {
          name: 'Same Status A',
          code: 'SSA-BL',
          transporterId,
          serviceTypeId,
          active: true,
        },
        {
          name: 'Same Status B',
          code: 'SSB-BL',
          transporterId,
          serviceTypeId,
          active: true,
        },
      ];

      const createdBusLines: BusLine[] = [];

      try {
        for (const busLine of sameActiveStatusBusLines) {
          const created = await createBusLine(busLine);
          createdBusLines.push(created);
          additionalBusLineIds.push(created.id);
        }

        const response = await listBusLines({
          orderBy: [
            { field: 'active', direction: 'desc' },
            { field: 'name', direction: 'asc' },
          ],
        });

        const activeBusLines = response.data.filter((bl) => bl.active === true);
        const activeNames = activeBusLines.map((bl) => bl.name);

        for (let i = 0; i < activeNames.length - 1; i++) {
          if (activeBusLines[i].active === activeBusLines[i + 1].active) {
            expect(activeNames[i] <= activeNames[i + 1]).toBe(true);
          }
        }
      } finally {
        for (const busLine of createdBusLines) {
          await deleteBusLine({ id: busLine.id });
          additionalBusLineIds = additionalBusLineIds.filter(
            (id) => id !== busLine.id,
          );
        }
      }
    });
  });
});
