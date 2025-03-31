import { expect, describe, test, afterAll } from 'vitest';
import {
  createServiceType,
  getServiceType,
  listServiceTypesPaginated,
  updateServiceType,
  deleteServiceType,
  listServiceTypes,
} from './service-types.controller';

describe('Service Types Controller', () => {
  // Test data
  const testServiceType = {
    name: 'Test Service Type',
    description: 'A service type for testing',
    code: 'TEST-SVC-01',
    active: true,
  };

  // Variable to store created IDs for cleanup
  let createdServiceTypeId: number;
  // Array to track additional service types created in tests
  const additionalServiceTypeIds: number[] = [];

  // Clean up after all tests
  afterAll(async () => {
    // Clean up any additional service types created during tests
    for (const id of additionalServiceTypeIds) {
      try {
        await deleteServiceType({ id });
      } catch (error) {
        console.log(`Error cleaning up additional service type ${id}:`, error);
      }
    }

    // Clean up the main created service type if any
    if (createdServiceTypeId) {
      try {
        await deleteServiceType({ id: createdServiceTypeId });
      } catch (error) {
        console.log('Error cleaning up test service type:', error);
      }
    }
  });

  describe('success scenarios', () => {
    test('should create a new service type', async () => {
      // Create a new service type
      const response = await createServiceType(testServiceType);

      // Store the ID for later cleanup
      createdServiceTypeId = response.id;

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(testServiceType.name);
      expect(response.description).toBe(testServiceType.description);
      expect(response.active).toBe(testServiceType.active);
      expect(response.createdAt).toBeDefined();
    });

    test('should retrieve a service type by ID', async () => {
      const response = await getServiceType({ id: createdServiceTypeId });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdServiceTypeId);
      expect(response.name).toBe(testServiceType.name);
      expect(response.description).toBe(testServiceType.description);
      expect(response.active).toBe(testServiceType.active);
    });

    test('should retrieve all service types', async () => {
      const response = await listServiceTypes();

      expect(response).toBeDefined();
      expect(response.serviceTypes).toBeDefined();
      expect(Array.isArray(response.serviceTypes)).toBe(true);

      // We should at least find our test service type
      expect(
        response.serviceTypes.some(
          (serviceType) => serviceType.id === createdServiceTypeId,
        ),
      ).toBe(true);
    });

    test('should retrieve paginated service types', async () => {
      const result = await listServiceTypesPaginated({
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

      // We should at least find our test service type
      expect(
        result.data.some(
          (serviceType) => serviceType.id === createdServiceTypeId,
        ),
      ).toBe(true);

      // Pagination values should make sense
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.pageSize).toBe(10);
      expect(result.pagination.totalCount).toBeGreaterThanOrEqual(1);
    });

    test('pagination should respect pageSize parameter', async () => {
      // Request with a small page size
      const result = await listServiceTypesPaginated({
        page: 1,
        pageSize: 1,
      });

      expect(result.data.length).toBeLessThanOrEqual(1);
      expect(result.pagination.pageSize).toBe(1);
    });

    test('should update a service type', async () => {
      const updatedName = 'Updated Test Service Type';
      const updatedDescription = 'Updated description for testing';

      const response = await updateServiceType({
        id: createdServiceTypeId,
        name: updatedName,
        description: updatedDescription,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdServiceTypeId);
      expect(response.name).toBe(updatedName);
      expect(response.description).toBe(updatedDescription);
    });

    test('should update service type active status', async () => {
      const response = await updateServiceType({
        id: createdServiceTypeId,
        active: false,
      });

      expect(response).toBeDefined();
      expect(response.active).toBe(false);
    });

    test('should delete a service type', async () => {
      // Create a service type specifically for deletion test
      const serviceTypeToDelete = await createServiceType({
        name: 'Service Type To Delete',
        description: 'This will be deleted',
        active: true,
      });

      // Delete should not throw an error
      await expect(
        deleteServiceType({ id: serviceTypeToDelete.id }),
      ).resolves.not.toThrow();

      // Attempt to get should throw a not found error
      await expect(
        getServiceType({ id: serviceTypeToDelete.id }),
      ).rejects.toThrow();
    });
  });

  describe('error scenarios', () => {
    // NOTE: We are not testing the validation errors because it's handled by Encore rust runtime and they are not thrown in the controller

    test('should handle not found errors', async () => {
      await expect(getServiceType({ id: 9999 })).rejects.toThrow();
    });

    test('should handle duplicate names', async () => {
      // First, create a service type with a specific name for this test
      const nameForDuplicateTest = 'Unique Name For Duplicate Test';

      const serviceTypeWithUniqueName = await createServiceType({
        name: nameForDuplicateTest,
        description: 'Testing duplicate name handling',
        active: true,
      });

      // Add to cleanup list
      additionalServiceTypeIds.push(serviceTypeWithUniqueName.id);

      // Now try to create another service type with the same name
      await expect(
        createServiceType({
          name: nameForDuplicateTest, // Same name as the service type we just created
          description: 'Another description',
          active: true,
        }),
      ).rejects.toThrow();
    });
  });
});
