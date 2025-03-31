import { expect, describe, test, beforeAll, afterAll } from 'vitest';
import {
  createBusLine,
  getBusLine,
  listBusLines,
  listBusLinesPaginated,
  updateBusLine,
  deleteBusLine,
} from './bus-lines.controller';
import {
  createTransporter,
  deleteTransporter,
} from '../transporters/transporters.controller';
import {
  createServiceType,
  deleteServiceType,
} from '../service-types/service-types.controller';

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
    primaryColor: '#FF0000',
    secondaryColor: '#0000FF',
    active: true,
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
      } catch (error) {
        console.log(`Error cleaning up additional bus line ${id}:`, error);
      }
    }

    // Clean up the main created bus line if any
    if (createdBusLineId) {
      try {
        await deleteBusLine({ id: createdBusLineId });
      } catch (error) {
        console.log('Error cleaning up test bus line:', error);
      }
    }

    // Clean up the created service type
    if (serviceTypeId) {
      try {
        await deleteServiceType({ id: serviceTypeId });
      } catch (error) {
        console.log('Error cleaning up test service type:', error);
      }
    }

    // Clean up the created transporter
    if (transporterId) {
      try {
        await deleteTransporter({ id: transporterId });
      } catch (error) {
        console.log('Error cleaning up test transporter:', error);
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
      expect(response.primaryColor).toBe(testBusLine.primaryColor);
      expect(response.secondaryColor).toBe(testBusLine.secondaryColor);
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
      expect(response.transporterId).toBe(testBusLine.transporterId);
      expect(response.serviceTypeId).toBe(testBusLine.serviceTypeId);
    });

    test('should list all bus lines', async () => {
      const result = await listBusLines();

      expect(result).toBeDefined();
      expect(Array.isArray(result.busLines)).toBe(true);

      // Verify our test bus line is in the list
      expect(
        result.busLines.some((busLine) => busLine.id === createdBusLineId),
      ).toBe(true);
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

      const response = await updateBusLine({
        id: createdBusLineId,
        name: updatedName,
        description: updatedDescription,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdBusLineId);
      expect(response.name).toBe(updatedName);
      expect(response.description).toBe(updatedDescription);
      // Other fields should remain unchanged
      expect(response.code).toBe(testBusLine.code);
      expect(response.transporterId).toBe(testBusLine.transporterId);
      expect(response.serviceTypeId).toBe(testBusLine.serviceTypeId);
    });

    test('should update bus line colors', async () => {
      const updatedPrimaryColor = '#00FF00';
      const updatedSecondaryColor = '#FF00FF';

      const response = await updateBusLine({
        id: createdBusLineId,
        primaryColor: updatedPrimaryColor,
        secondaryColor: updatedSecondaryColor,
      });

      expect(response).toBeDefined();
      expect(response.primaryColor).toBe(updatedPrimaryColor);
      expect(response.secondaryColor).toBe(updatedSecondaryColor);
    });

    test('should delete a bus line', async () => {
      // Create a bus line specifically for deletion test
      const busLineToDelete = await createBusLine({
        name: 'Bus Line To Delete',
        code: 'DEL-BL',
        transporterId: transporterId,
        serviceTypeId: serviceTypeId,
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
          transporterId: transporterId,
          serviceTypeId: 9999, // Non-existent service type ID
          active: true,
        }),
      ).rejects.toThrow();
    });
  });
});
