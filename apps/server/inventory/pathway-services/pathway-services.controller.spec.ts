import { afterAll, describe, expect, test } from 'vitest';
import { PaginationParams } from '../../shared/types';
import {
  createPathwayService,
  deletePathwayService,
  getPathwayService,
  listPathwayServices,
  listPathwayServicesPaginated,
  updatePathwayService,
} from './pathway-services.controller';

describe('Pathway Services Controller', () => {
  // Test data and setup
  const testPathwayService = {
    name: 'Test Pathway Service',
    serviceType: 'RESTROOM',
    latitude: 19.4326,
    longitude: -99.1332,
    category: 'BASIC',
    provider: 'Test Provider',
    providerScheduleHours: {
      monday: [{ open: '08:00', close: '20:00' }],
    },
    duration: 30,
  };

  // Variables to store created IDs for cleanup
  let createdPathwayServiceId: number;
  // Track all created pathway service IDs for proper cleanup
  const createdPathwayServiceIds: number[] = [];

  // Helper function to track created pathway services for cleanup
  const trackPathwayService = (id: number) => {
    if (!createdPathwayServiceIds.includes(id)) {
      createdPathwayServiceIds.push(id);
    }
    return id;
  };

  // Helper function to clean up a pathway service and remove it from tracking
  const cleanupPathwayService = async (id: number) => {
    try {
      await deletePathwayService({ id });
      // Remove from tracking
      const index = createdPathwayServiceIds.indexOf(id);
      if (index > -1) {
        createdPathwayServiceIds.splice(index, 1);
      }
    } catch (error) {
      // Don't log not found errors in test mode as they're expected during cleanup
      if (!(error instanceof Error && error.message.includes('not found'))) {
        console.log(`Error cleaning up pathway service (ID: ${id}):`, error);
      }

      // Always remove from tracking even if delete failed
      const index = createdPathwayServiceIds.indexOf(id);
      if (index > -1) {
        createdPathwayServiceIds.splice(index, 1);
      }
    }
  };

  // Helper function to create a test pathway service with a given name
  const createTestPathwayService = async (name: string, options = {}) => {
    const pathwayService = await createPathwayService({
      name,
      serviceType: 'RESTROOM',
      latitude: 19.4326,
      longitude: -99.1332,
      category: 'BASIC',
      provider: 'Test Provider',
      providerScheduleHours: {
        monday: [{ open: '08:00', close: '20:00' }],
      },
      duration: 30,
      ...options,
    });
    return trackPathwayService(pathwayService.id);
  };

  // Clean up after all tests
  afterAll(async () => {
    // Clean up all created pathway services
    for (const id of [...createdPathwayServiceIds]) {
      await cleanupPathwayService(id);
    }

    // Clean up the main test pathway service if it exists
    if (
      createdPathwayServiceId &&
      !createdPathwayServiceIds.includes(createdPathwayServiceId)
    ) {
      await cleanupPathwayService(createdPathwayServiceId);
    }
  });

  describe('success scenarios', () => {
    test('should create a new pathway service', async () => {
      // Create a new pathway service
      const response = await createPathwayService(testPathwayService);

      // Store the ID for later cleanup
      createdPathwayServiceId = response.id;
      trackPathwayService(createdPathwayServiceId);

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(testPathwayService.name);
      expect(response.serviceType).toBe(testPathwayService.serviceType);
      expect(response.latitude).toBe(testPathwayService.latitude);
      expect(response.longitude).toBe(testPathwayService.longitude);
      expect(response.category).toBe(testPathwayService.category);
      expect(response.provider).toBe(testPathwayService.provider);
      expect(response.providerScheduleHours).toEqual(
        testPathwayService.providerScheduleHours,
      );
      expect(response.duration).toBe(testPathwayService.duration);
      expect(response.createdAt).toBeDefined();
    });

    test('should retrieve a pathway service by ID', async () => {
      const response = await getPathwayService({ id: createdPathwayServiceId });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdPathwayServiceId);
      expect(response.name).toBe(testPathwayService.name);
      expect(response.serviceType).toBe(testPathwayService.serviceType);
      expect(response.latitude).toBe(testPathwayService.latitude);
      expect(response.longitude).toBe(testPathwayService.longitude);
      expect(response.category).toBe(testPathwayService.category);
      expect(response.provider).toBe(testPathwayService.provider);
      expect(response.providerScheduleHours).toEqual(
        testPathwayService.providerScheduleHours,
      );
      expect(response.duration).toBe(testPathwayService.duration);
    });

    test('should retrieve all pathway services', async () => {
      const secondPathwayServicePayload = {
        ...testPathwayService,
        name: 'Test Pathway Service 2',
      };
      const secondService = await createPathwayService(
        secondPathwayServicePayload,
      );
      trackPathwayService(secondService.id);
      const result = await listPathwayServices();

      expect(result).toBeDefined();
      expect(Array.isArray(result.pathwayServices)).toBe(true);

      // We should at least find our test pathway service
      expect(
        result.pathwayServices.some(
          (service) => service.id === createdPathwayServiceId,
        ),
      ).toBe(true);
    });

    test('should retrieve paginated pathway services', async () => {
      const result = await listPathwayServicesPaginated({
        page: 1,
        pageSize: 10,
      });

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

      // We should at least find our test pathway service
      expect(
        result.data.some((service) => service.id === createdPathwayServiceId),
      ).toBe(true);

      // Pagination values should make sense
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.pageSize).toBe(10);
      expect(result.pagination.totalCount).toBeGreaterThanOrEqual(1);
    });

    test('pagination should respect pageSize parameter', async () => {
      // Request with a small page size
      const result = await listPathwayServicesPaginated({
        page: 1,
        pageSize: 1,
      });

      expect(result.data.length).toBe(1);
      expect(result.pagination.pageSize).toBe(1);
    });

    test('should update a pathway service name', async () => {
      const updatedName = 'Updated Test Pathway Service';
      const response = await updatePathwayService({
        id: createdPathwayServiceId,
        name: updatedName,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdPathwayServiceId);
      expect(response.name).toBe(updatedName);
      expect(response.serviceType).toBe(testPathwayService.serviceType);
    });

    test('should update pathway service serviceType', async () => {
      const newServiceType = 'RESTAURANT';

      const response = await updatePathwayService({
        id: createdPathwayServiceId,
        serviceType: newServiceType,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdPathwayServiceId);
      expect(response.serviceType).toBe(newServiceType);
    });

    test('should update pathway service category', async () => {
      const newCategory = 'PREMIUM';

      const response = await updatePathwayService({
        id: createdPathwayServiceId,
        category: newCategory,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdPathwayServiceId);
      expect(response.category).toBe(newCategory);
    });

    test('should update pathway service providerScheduleHours', async () => {
      const newProviderScheduleHours = {
        monday: [{ open: '09:00', close: '21:00' }],
        tuesday: [{ open: '09:00', close: '21:00' }],
      };

      const response = await updatePathwayService({
        id: createdPathwayServiceId,
        providerScheduleHours: newProviderScheduleHours,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdPathwayServiceId);
      expect(response.providerScheduleHours).toEqual(newProviderScheduleHours);
    });

    test('should delete a pathway service', async () => {
      // Create a pathway service specifically for deletion test
      const pathwayServiceId = await createTestPathwayService(
        'Pathway Service To Delete',
      );

      // Delete should not throw an error
      await expect(
        deletePathwayService({ id: pathwayServiceId }),
      ).resolves.not.toThrow();

      // Remove from tracking list since it's been deleted
      const index = createdPathwayServiceIds.indexOf(pathwayServiceId);
      if (index > -1) {
        createdPathwayServiceIds.splice(index, 1);
      }

      // Attempt to get should throw a not found error
      await expect(
        getPathwayService({ id: pathwayServiceId }),
      ).rejects.toThrow();
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors', async () => {
      await expect(getPathwayService({ id: 9999 })).rejects.toThrow();
    });

    test('should handle duplicate pathway service names', async () => {
      // Create a pathway service with a unique name first
      const uniqueName = 'Unique Test Pathway Service';
      const pathwayServiceId = await createTestPathwayService(uniqueName);

      try {
        // Try to create another pathway service with the same name
        await expect(
          createPathwayService({
            name: uniqueName, // Same name as the pathway service we just created
            serviceType: 'RESTROOM',
            latitude: 19.4326,
            longitude: -99.1332,
            category: 'BASIC',
            provider: 'Test Provider',
            providerScheduleHours: {
              monday: [{ open: '08:00', close: '20:00' }],
            },
            duration: 30,
          }),
        ).rejects.toThrow();
      } finally {
        await cleanupPathwayService(pathwayServiceId);
      }
    });
  });

  describe('pagination', () => {
    test('should return paginated pathway services with default parameters', async () => {
      const response = await listPathwayServicesPaginated(
        {} as PaginationParams,
      );

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
      const response = await listPathwayServicesPaginated({
        page: 1,
        pageSize: 5,
      });

      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
      expect(response.data.length).toBeLessThanOrEqual(5);
    });

    test('should handle pagination for empty results', async () => {
      // Create a high page number that should have no results
      const highPageNumber = 999;
      const response = await listPathwayServicesPaginated({
        page: highPageNumber,
        pageSize: 10,
      });

      // Should return an empty data array but with valid pagination info
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBe(0);
      expect(response.pagination.currentPage).toBe(highPageNumber);
      expect(response.pagination.hasPreviousPage).toBe(true);
      expect(response.pagination.hasNextPage).toBe(false);
    });
  });
});
