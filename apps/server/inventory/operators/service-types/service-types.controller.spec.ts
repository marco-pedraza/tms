import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { FieldValidationError } from '@repo/base-repo';
import { createCleanupHelper } from '@/tests/shared/test-utils';
import type { ServiceType } from './service-types.types';
import { ServiceTypeCategory } from './service-types.types';
import { serviceTypeRepository } from './service-types.repository';
import {
  createServiceType,
  deleteServiceType,
  getServiceType,
  listServiceTypes,
  listServiceTypesPaginated,
  updateServiceType,
} from './service-types.controller';

describe('Service Types Controller', () => {
  // Test data (use timestamp to ensure unique codes)
  const ts = Date.now().toString().slice(-6);
  const testServiceType = {
    name: 'Test Service Type',
    code: `TST${ts}`,
    category: ServiceTypeCategory.REGULAR,
    description: 'A service type for testing',
    active: true,
  } as const;

  // Cleanup helper for service types (hard delete to avoid FK issues)
  const serviceTypeCleanup = createCleanupHelper(
    ({ id }) => serviceTypeRepository.forceDelete(id),
    'service type',
  );
  // Variable to store created IDs for cleanup
  let createdServiceTypeId: number;

  // Clean up after all tests
  afterAll(async () => {
    await serviceTypeCleanup.cleanupAll();
  });

  describe('success scenarios', () => {
    test('should create a new service type', async () => {
      // Create a new service type
      const response = await createServiceType(testServiceType);

      // Store the ID for later cleanup
      createdServiceTypeId = serviceTypeCleanup.track(response.id);

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(testServiceType.name);
      expect(response.code).toBe(testServiceType.code);
      expect(response.category).toBe(ServiceTypeCategory.REGULAR);
      expect(response.description).toBe(testServiceType.description);
      expect(response.active).toBe(testServiceType.active);
      expect(response.createdAt).toBeDefined();
    });

    test('should retrieve a service type by ID', async () => {
      const response = await getServiceType({ id: createdServiceTypeId });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdServiceTypeId);
      expect(response.name).toBe(testServiceType.name);
      expect(response.code).toBe(testServiceType.code);
      expect(response.category).toBe(ServiceTypeCategory.REGULAR);
      expect(response.description).toBe(testServiceType.description);
      expect(response.active).toBe(testServiceType.active);
    });

    test('should retrieve all service types', async () => {
      const response = await listServiceTypes({});

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      // We should at least find our test service type
      expect(
        response.data.some(
          (serviceType) => serviceType.id === createdServiceTypeId,
        ),
      ).toBe(true);
    });

    test('should retrieve service types with filters', async () => {
      const response = await listServiceTypes({
        filters: { active: true },
        orderBy: [{ field: 'name', direction: 'asc' }],
      });

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      // All returned service types should be active
      response.data.forEach((serviceType) => {
        expect(serviceType.active).toBe(true);
      });
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

    test('should use search when searchTerm is provided in pagination', async () => {
      const result = await listServiceTypesPaginated({
        searchTerm: 'Test Service',
        page: 1,
        pageSize: 10,
      });

      // Check the structure of the response
      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination).toBeDefined();

      // Should find our test service type when searching
      expect(
        result.data.some(
          (serviceType) => serviceType.id === createdServiceTypeId,
        ),
      ).toBe(true);
    });

    test('should return different results with and without search term', async () => {
      // Get all results without search
      const allResults = await listServiceTypesPaginated({
        page: 1,
        pageSize: 100,
      });

      // Get results with search term
      const searchResults = await listServiceTypesPaginated({
        searchTerm: 'Test Service',
        page: 1,
        pageSize: 100,
      });

      // Search results should be a subset of all results (or equal if all match)
      expect(searchResults.data.length).toBeLessThanOrEqual(
        allResults.data.length,
      );
    });

    test('should search service types using searchTerm in list endpoint', async () => {
      const resp = await listServiceTypes({ searchTerm: 'Test Service' });
      expect(resp.data).toBeDefined();
      expect(Array.isArray(resp.data)).toBe(true);
      expect(resp.data.some((st) => st.id === createdServiceTypeId)).toBe(true);
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
      const ts2 = Date.now().toString().slice(-6);
      const serviceTypeToDelete = await createServiceType({
        name: 'Service Type To Delete',
        code: `DEL${ts2}`,
        category: ServiceTypeCategory.REGULAR,
        description: 'This will be deleted',
        active: true,
      });
      serviceTypeCleanup.track(serviceTypeToDelete.id);

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
    test('should handle not found errors', async () => {
      await expect(getServiceType({ id: 9999 })).rejects.toThrow();
    });

    test('should handle duplicate field validation errors (name)', async () => {
      // Create a service type to conflict against
      const ts3 = Date.now().toString().slice(-6);
      const st1 = await createServiceType({
        name: 'Duplicate Name Source',
        code: `SRC${ts3}`,
        category: ServiceTypeCategory.REGULAR,
        active: true,
      });
      serviceTypeCleanup.track(st1.id);

      // Try to create another with same name but different code
      await expect(
        createServiceType({
          name: st1.name,
          code: `OTH${ts3}`,
          category: ServiceTypeCategory.REGULAR,
          active: true,
        }),
      ).rejects.toThrow();
    });

    test('should throw detailed field validation error for duplicate code', async () => {
      const ts4 = Date.now().toString().slice(-6);
      const base = await createServiceType({
        name: 'Base For Code Dup',
        code: `DUP${ts4}`,
        category: ServiceTypeCategory.REGULAR,
        active: true,
      });
      serviceTypeCleanup.track(base.id);

      let validationError: FieldValidationError | undefined;
      try {
        await createServiceType({
          name: 'Another Name',
          code: base.code,
          category: ServiceTypeCategory.REGULAR,
          active: true,
        });
      } catch (error) {
        validationError = error as FieldValidationError;
      }

      expect(validationError).toBeDefined();
      const typed = validationError as FieldValidationError;
      expect(typed.name).toBe('FieldValidationError');
      expect(Array.isArray(typed.fieldErrors)).toBe(true);
      const codeErr = typed.fieldErrors.find((e) => e.field === 'code');
      expect(codeErr?.code).toBe('DUPLICATE');
      expect(codeErr?.value).toBe(base.code);
    });
  });

  describe('pagination', () => {
    test('should return paginated service types with default parameters', async () => {
      const response = await listServiceTypesPaginated({});

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(typeof response.pagination.pageSize).toBe('number');
    });

    test('should honor page and pageSize parameters', async () => {
      const response = await listServiceTypesPaginated({
        page: 1,
        pageSize: 5,
      });
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
      expect(response.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('ordering and filtering', () => {
    const testServiceTypes: ServiceType[] = [];

    beforeAll(async () => {
      const tsBase = Date.now().toString().slice(-6);
      const items = [
        { name: 'Alpha ST', code: `A${tsBase}`, active: true },
        { name: 'Beta ST', code: `B${tsBase}`, active: false },
        { name: 'Gamma ST', code: `G${tsBase}`, active: true },
      ];

      for (const it of items) {
        const created = await createServiceType({
          name: it.name,
          code: it.code,
          category: ServiceTypeCategory.REGULAR,
          active: it.active,
        });
        testServiceTypes.push(created);
      }
    });

    afterAll(async () => {
      for (const st of testServiceTypes) {
        try {
          await deleteServiceType({ id: st.id });
        } catch (error) {
          console.log(`Error cleaning up test service type ${st.id}:`, error);
        }
      }
    });

    test('should order service types by name descending', async () => {
      const response = await listServiceTypes({
        orderBy: [{ field: 'name', direction: 'desc' }],
      });

      const names = response.data.map((s) => s.name);
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] >= names[i + 1]).toBe(true);
      }
    });

    test('should filter service types by active status', async () => {
      const response = await listServiceTypes({ filters: { active: true } });
      expect(response.data.every((s) => s.active === true)).toBe(true);
      const activeIds = testServiceTypes
        .filter((s) => s.active)
        .map((s) => s.id);
      for (const id of activeIds) {
        expect(response.data.some((s) => s.id === id)).toBe(true);
      }
    });
  });
});
