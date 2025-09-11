import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { FieldValidationError } from '@repo/base-repo';
import { amenitiesRepository } from '@/inventory/shared-entities/amenities/amenities.repository';
import {
  AmenityCategory,
  AmenityType,
} from '@/inventory/shared-entities/amenities/amenities.types';
import {
  createCleanupHelper,
  createTestSuiteId,
  createUniqueEntity,
  safeCleanup,
} from '@/tests/shared/test-utils';
import type { ServiceType } from './service-types.types';
import { serviceTypeRepository } from './service-types.repository';
import {
  assignAmenitiesToServiceType,
  createServiceType,
  deleteServiceType,
  getServiceType,
  listServiceTypes,
  listServiceTypesPaginated,
  updateServiceType,
} from './service-types.controller';

/**
 * Test data interface for consistent test setup
 */
interface TestData {
  suiteId: string;
  serviceTypeCleanup: ReturnType<typeof createCleanupHelper>;
  amenityCleanup: ReturnType<typeof createCleanupHelper>;
  testAmenityIds: number[];
  createdServiceTypeIds: number[];
}

describe('Service Types Controller', () => {
  let testData: TestData;

  /**
   * Creates fresh test data for each test to ensure isolation
   */
  async function createTestData(): Promise<TestData> {
    const suiteId = createTestSuiteId('service-types');

    const serviceTypeCleanup = createCleanupHelper(
      ({ id }) => serviceTypeRepository.forceDelete(id),
      'service type',
    );

    const amenityCleanup = createCleanupHelper(
      ({ id }) => amenitiesRepository.forceDelete(id),
      'amenity',
    );

    // Create test amenities for this test suite
    const amenity1Entity = createUniqueEntity({
      baseName: 'Test Amenity 1',
      suiteId,
    });

    const amenity2Entity = createUniqueEntity({
      baseName: 'Test Amenity 2',
      suiteId,
    });

    const amenity1 = await amenitiesRepository.create({
      name: amenity1Entity.name,
      category: AmenityCategory.COMFORT,
      amenityType: AmenityType.SERVICE_TYPE,
      description: 'Test amenity 1',
      iconName: 'wifi',
      active: true,
    });

    const amenity2 = await amenitiesRepository.create({
      name: amenity2Entity.name,
      category: AmenityCategory.TECHNOLOGY,
      amenityType: AmenityType.SERVICE_TYPE,
      description: 'Test amenity 2',
      iconName: 'tv',
      active: true,
    });

    const testAmenityIds = [
      amenityCleanup.track(amenity1.id),
      amenityCleanup.track(amenity2.id),
    ];

    return {
      suiteId,
      serviceTypeCleanup,
      amenityCleanup,
      testAmenityIds,
      createdServiceTypeIds: [],
    };
  }

  /**
   * Cleans up test data after each test
   */
  async function cleanupTestData(data: TestData): Promise<void> {
    // First, clean up the junction table by removing amenity assignments
    // This is done by calling the controller to unassign all amenities
    for (const serviceTypeId of data.createdServiceTypeIds) {
      try {
        await assignAmenitiesToServiceType({
          id: serviceTypeId,
          amenityIds: [], // Remove all amenities
        });
      } catch {
        // Service type might already be deleted, ignore
      }
    }

    // Clean up service types first (they reference amenities)
    await data.serviceTypeCleanup.cleanupAll();

    // Clean up amenities
    await data.amenityCleanup.cleanupAll();
  }

  /**
   * Creates a test service type with unique data
   */
  async function createTestServiceType(
    data: TestData,
    overrides: Partial<Parameters<typeof createServiceType>[0]> = {},
  ): Promise<ServiceType> {
    const serviceTypeEntity = createUniqueEntity({
      baseName: 'Test Service Type',
      baseCode: 'TST',
      suiteId: data.suiteId,
    });

    const serviceType = await createServiceType({
      name: serviceTypeEntity.name,
      code: serviceTypeEntity.code || 'TST001',
      description: 'A service type for testing',
      active: true,
      ...overrides,
    });

    // Track for cleanup
    data.serviceTypeCleanup.track(serviceType.id);
    data.createdServiceTypeIds.push(serviceType.id);
    return serviceType;
  }

  beforeEach(async () => {
    testData = await createTestData();
  });

  afterEach(async () => {
    await cleanupTestData(testData);
  });

  describe('success scenarios', () => {
    test('should create a new service type', async () => {
      const response = await createTestServiceType(testData);

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toContain('Test Service Type');
      expect(response.code).toContain('TST');
      expect(response.description).toBe('A service type for testing');
      expect(response.active).toBe(true);
      expect(response.createdAt).toBeDefined();
    });

    test('should retrieve a service type by ID', async () => {
      const createdServiceType = await createTestServiceType(testData);

      const response = await getServiceType({ id: createdServiceType.id });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdServiceType.id);
      expect(response.name).toBe(createdServiceType.name);
      expect(response.code).toBe(createdServiceType.code);
      expect(response.description).toBe(createdServiceType.description);
      expect(response.active).toBe(createdServiceType.active);
    });

    test('should retrieve all service types', async () => {
      const createdServiceType = await createTestServiceType(testData);

      const response = await listServiceTypes({});

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      // We should at least find our test service type
      expect(
        response.data.some(
          (serviceType) => serviceType.id === createdServiceType.id,
        ),
      ).toBe(true);
    });

    test('should retrieve service types with filters', async () => {
      // Create both active and inactive service types with unique names
      const activeEntity = createUniqueEntity({
        baseName: 'Active Service Type',
        baseCode: 'ACTV',
        suiteId: testData.suiteId,
      });
      const inactiveEntity = createUniqueEntity({
        baseName: 'Inactive Service Type',
        baseCode: 'INAC',
        suiteId: testData.suiteId,
      });

      await createTestServiceType(testData, {
        name: activeEntity.name,
        code: activeEntity.code || 'ACTV001',
        active: true,
      });
      await createTestServiceType(testData, {
        name: inactiveEntity.name,
        code: inactiveEntity.code || 'INAC001',
        active: false,
      });

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
      const createdServiceType = await createTestServiceType(testData);

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
          (serviceType) => serviceType.id === createdServiceType.id,
        ),
      ).toBe(true);

      // Pagination values should make sense
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.pageSize).toBe(10);
      expect(result.pagination.totalCount).toBeGreaterThanOrEqual(1);
    });

    test('pagination should respect pageSize parameter', async () => {
      // Create a service type to ensure we have at least one
      await createTestServiceType(testData);

      const result = await listServiceTypesPaginated({
        page: 1,
        pageSize: 1,
      });

      expect(result.data.length).toBeLessThanOrEqual(1);
      expect(result.pagination.pageSize).toBe(1);
    });

    test('should use search when searchTerm is provided in pagination', async () => {
      const createdServiceType = await createTestServiceType(testData);

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
          (serviceType) => serviceType.id === createdServiceType.id,
        ),
      ).toBe(true);
    });

    test('should return different results with and without search term', async () => {
      await createTestServiceType(testData);

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
      const createdServiceType = await createTestServiceType(testData);

      const resp = await listServiceTypes({ searchTerm: 'Test Service' });
      expect(resp.data).toBeDefined();
      expect(Array.isArray(resp.data)).toBe(true);
      expect(resp.data.some((st) => st.id === createdServiceType.id)).toBe(
        true,
      );
    });

    test('should update a service type', async () => {
      const createdServiceType = await createTestServiceType(testData);
      const updatedName = 'Updated Test Service Type';
      const updatedDescription = 'Updated description for testing';

      const response = await updateServiceType({
        id: createdServiceType.id,
        name: updatedName,
        description: updatedDescription,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdServiceType.id);
      expect(response.name).toBe(updatedName);
      expect(response.description).toBe(updatedDescription);
    });

    test('should update service type active status', async () => {
      const createdServiceType = await createTestServiceType(testData);

      const response = await updateServiceType({
        id: createdServiceType.id,
        active: false,
      });

      expect(response).toBeDefined();
      expect(response.active).toBe(false);
    });

    describe('amenity assignment', () => {
      test('should assign amenities to a service type', async () => {
        const createdServiceType = await createTestServiceType(testData);

        const response = await assignAmenitiesToServiceType({
          id: createdServiceType.id,
          amenityIds: testData.testAmenityIds,
        });

        expect(response).toBeDefined();
        expect(response.id).toBe(createdServiceType.id);

        // Verify amenities were assigned by getting the service type
        const serviceType = await getServiceType({ id: createdServiceType.id });
        expect(serviceType.amenities).toBeDefined();
        expect(serviceType.amenities.length).toBe(
          testData.testAmenityIds.length,
        );
        expect(
          serviceType.amenities.map((a) => a.id).sort((a, b) => a - b),
        ).toEqual([...testData.testAmenityIds].sort((a, b) => a - b));
      });

      test('should update assigned amenities', async () => {
        const createdServiceType = await createTestServiceType(testData);

        // Assign only the first amenity
        const response = await assignAmenitiesToServiceType({
          id: createdServiceType.id,
          amenityIds: [testData.testAmenityIds[0]],
        });

        expect(response).toBeDefined();
        expect(response.id).toBe(createdServiceType.id);

        // Verify only one amenity is assigned
        const serviceType = await getServiceType({ id: createdServiceType.id });
        expect(serviceType.amenities).toBeDefined();
        expect(serviceType.amenities.length).toBe(1);
        expect(serviceType.amenities[0].id).toBe(testData.testAmenityIds[0]);
      });

      test('should remove all amenities when empty array is provided', async () => {
        const createdServiceType = await createTestServiceType(testData);

        const response = await assignAmenitiesToServiceType({
          id: createdServiceType.id,
          amenityIds: [],
        });

        expect(response).toBeDefined();
        expect(response.id).toBe(createdServiceType.id);

        // Verify no amenities are assigned
        const serviceType = await getServiceType({ id: createdServiceType.id });
        expect(serviceType.amenities).toBeDefined();
        expect(serviceType.amenities.length).toBe(0);
      });
    });

    test('should delete a service type', async () => {
      const serviceTypeToDelete = await createTestServiceType(testData, {
        name: 'Service Type To Delete',
        description: 'This will be deleted',
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
    test('should handle not found errors', async () => {
      await expect(getServiceType({ id: 9999 })).rejects.toThrow();
    });

    describe('amenity assignment errors', () => {
      test('should handle duplicate amenity IDs with DUPLICATE_VALUES error', async () => {
        const createdServiceType = await createTestServiceType(testData);
        const duplicateIds = [
          testData.testAmenityIds[0],
          testData.testAmenityIds[0],
        ]; // Same ID twice

        try {
          await assignAmenitiesToServiceType({
            id: createdServiceType.id,
            amenityIds: duplicateIds,
          });
          expect(true).toBe(false); // Should have thrown FieldValidationError
        } catch (error) {
          expect(error).toBeInstanceOf(FieldValidationError);
          const fieldError = error as FieldValidationError;
          expect(fieldError.fieldErrors).toContainEqual(
            expect.objectContaining({
              field: 'amenityIds',
              code: 'DUPLICATE_VALUES',
              message: 'Duplicate amenity IDs are not allowed',
              value: duplicateIds,
            }),
          );
        }
      });

      test('should handle invalid amenity IDs with INVALID_VALUES error', async () => {
        const createdServiceType = await createTestServiceType(testData);
        const invalidId = 99999; // Non-existent ID

        try {
          await assignAmenitiesToServiceType({
            id: createdServiceType.id,
            amenityIds: [invalidId],
          });
          expect(true).toBe(false); // Should have thrown FieldValidationError
        } catch (error) {
          expect(error).toBeInstanceOf(FieldValidationError);
          const fieldError = error as FieldValidationError;
          expect(fieldError.fieldErrors).toContainEqual(
            expect.objectContaining({
              field: 'amenityIds',
              code: 'INVALID_VALUES',
              value: [invalidId],
            }),
          );
        }
      });

      test('should handle non-service-type amenity IDs with INVALID_VALUES error', async () => {
        const createdServiceType = await createTestServiceType(testData);

        // Create an installation type amenity
        const installationAmenityEntity = createUniqueEntity({
          baseName: 'Installation Amenity',
          suiteId: testData.suiteId,
        });

        const installationAmenity = await amenitiesRepository.create({
          name: installationAmenityEntity.name,
          category: AmenityCategory.COMFORT,
          amenityType: AmenityType.INSTALLATION, // Different type
          description: 'Installation type amenity',
          iconName: 'test',
          active: true,
        });

        try {
          await assignAmenitiesToServiceType({
            id: createdServiceType.id,
            amenityIds: [installationAmenity.id],
          });
          expect(true).toBe(false); // Should have thrown FieldValidationError
        } catch (error) {
          expect(error).toBeInstanceOf(FieldValidationError);
          const fieldError = error as FieldValidationError;
          expect(fieldError.fieldErrors).toContainEqual(
            expect.objectContaining({
              field: 'amenityIds',
              code: 'INVALID_VALUES',
              value: [installationAmenity.id],
            }),
          );
        }

        // Clean up
        await safeCleanup(
          async () => {
            await amenitiesRepository.forceDelete(installationAmenity.id);
          },
          'installation amenity',
          installationAmenity.id,
        );
      });

      test('should handle inactive amenity IDs with INVALID_VALUES error', async () => {
        const createdServiceType = await createTestServiceType(testData);

        // Create an inactive service type amenity
        const inactiveAmenityEntity = createUniqueEntity({
          baseName: 'Inactive Amenity',
          suiteId: testData.suiteId,
        });

        const inactiveAmenity = await amenitiesRepository.create({
          name: inactiveAmenityEntity.name,
          category: AmenityCategory.COMFORT,
          amenityType: AmenityType.SERVICE_TYPE,
          description: 'Inactive service type amenity',
          iconName: 'test',
          active: false, // Inactive
        });

        try {
          await assignAmenitiesToServiceType({
            id: createdServiceType.id,
            amenityIds: [inactiveAmenity.id],
          });
          expect(true).toBe(false); // Should have thrown FieldValidationError
        } catch (error) {
          expect(error).toBeInstanceOf(FieldValidationError);
          const fieldError = error as FieldValidationError;
          expect(fieldError.fieldErrors).toContainEqual(
            expect.objectContaining({
              field: 'amenityIds',
              code: 'INVALID_VALUES',
              value: [inactiveAmenity.id],
            }),
          );
        }

        // Clean up
        await safeCleanup(
          async () => {
            await amenitiesRepository.forceDelete(inactiveAmenity.id);
          },
          'inactive amenity',
          inactiveAmenity.id,
        );
      });
    });

    test('should throw detailed field validation error for duplicate code', async () => {
      const base = await createTestServiceType(testData, {
        name: 'Base For Code Dup',
      });

      let validationError: FieldValidationError | undefined;
      try {
        await createServiceType({
          name: 'Another Name',
          code: base.code,
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
      await createTestServiceType(testData); // Ensure we have at least one

      const response = await listServiceTypesPaginated({});

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(typeof response.pagination.pageSize).toBe('number');
    });

    test('should honor page and pageSize parameters', async () => {
      await createTestServiceType(testData); // Ensure we have at least one

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
    test('should order service types by name descending', async () => {
      // Create multiple service types with predictable names for ordering test
      const alphaEntity = createUniqueEntity({
        baseName: 'Alpha ST',
        baseCode: 'ALPHA',
        suiteId: testData.suiteId,
      });
      const betaEntity = createUniqueEntity({
        baseName: 'Beta ST',
        baseCode: 'BETA',
        suiteId: testData.suiteId,
      });
      const gammaEntity = createUniqueEntity({
        baseName: 'Gamma ST',
        baseCode: 'GAMMA',
        suiteId: testData.suiteId,
      });

      await createTestServiceType(testData, {
        name: alphaEntity.name,
        code: alphaEntity.code || 'ALPHA001',
        active: true,
      });
      await createTestServiceType(testData, {
        name: betaEntity.name,
        code: betaEntity.code || 'BETA001',
        active: false,
      });
      await createTestServiceType(testData, {
        name: gammaEntity.name,
        code: gammaEntity.code || 'GAMMA001',
        active: true,
      });

      const response = await listServiceTypes({
        orderBy: [{ field: 'name', direction: 'desc' }],
      });

      const names = response.data.map((s) => s.name);
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] >= names[i + 1]).toBe(true);
      }
    });

    test('should filter service types by active status', async () => {
      // Create both active and inactive service types with unique names
      const activeEntity = createUniqueEntity({
        baseName: 'Filter Active ST',
        baseCode: 'FACT',
        suiteId: testData.suiteId,
      });
      const inactiveEntity = createUniqueEntity({
        baseName: 'Filter Inactive ST',
        baseCode: 'FINC',
        suiteId: testData.suiteId,
      });

      await createTestServiceType(testData, {
        name: activeEntity.name,
        code: activeEntity.code || 'FACT001',
        active: true,
      });
      await createTestServiceType(testData, {
        name: inactiveEntity.name,
        code: inactiveEntity.code || 'FINC001',
        active: false,
      });

      const response = await listServiceTypes({ filters: { active: true } });
      expect(response.data.every((s) => s.active === true)).toBe(true);
    });
  });
});
