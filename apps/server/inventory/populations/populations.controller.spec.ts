import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { FieldValidationError } from '@repo/base-repo';
import {
  cityFactory,
  countryFactory,
  stateFactory,
} from '../../tests/factories';
import { getFactoryDb } from '../../tests/factories/factory-utils';
import {
  createCleanupHelper,
  createTestSuiteId,
  createUniqueCode,
  createUniqueName,
} from '../../tests/shared/test-utils';
import { cityRepository } from '../cities/cities.repository';
import type { City } from '../cities/cities.types';
import { countryRepository } from '../countries/countries.repository';
import type { Country } from '../countries/countries.types';
import { db } from '../db-service';
import { stateRepository } from '../states/states.repository';
import type { State } from '../states/states.types';
import type { Population } from './populations.types';
import { populationRepository } from './populations.repository';
import {
  assignCitiesToPopulation,
  createPopulation,
  deletePopulation,
  getPopulation,
  listPopulations,
  listPopulationsPaginated,
  updatePopulation,
} from './populations.controller';

describe('Populations Controller', () => {
  const testSuiteId = createTestSuiteId('populations-controller');

  // Cleanup helpers using test-utils
  const populationCleanup = createCleanupHelper(deletePopulation, 'population');

  // Helper function to create test populations with unique names and codes
  const createTestPopulation = async (baseName: string, options = {}) => {
    const uniqueName = createUniqueName(baseName, testSuiteId);
    const uniqueCode = createUniqueCode('TP');
    const population = await createPopulation({
      name: uniqueName,
      code: uniqueCode,
      description: `${uniqueName} description`,
      active: true,
      ...options,
    });
    return populationCleanup.track(population.id);
  };

  // Helper function to verify field validation errors
  const expectFieldValidationError = async (
    asyncFn: () => Promise<void>,
    expectedField: string,
    expectedCode: string,
    expectedMessageFragment: string,
  ) => {
    let validationError: FieldValidationError;
    try {
      await asyncFn();
      throw new Error('Expected function to throw, but it did not');
    } catch (error) {
      validationError = error as FieldValidationError;
    }

    expect(validationError).toBeDefined();
    expect(validationError.name).toBe('FieldValidationError');
    expect(validationError.message).toContain('Validation failed');
    expect(validationError.fieldErrors).toBeDefined();
    expect(validationError.fieldErrors[0].field).toBe(expectedField);
    expect(validationError.fieldErrors[0].code).toBe(expectedCode);
    expect(validationError.fieldErrors[0].message).toContain(
      expectedMessageFragment,
    );
  };

  // Main test population for reuse across tests
  let testPopulation: Population;

  beforeAll(async () => {
    // Create a main test population for reuse in multiple tests
    const populationData = {
      name: createUniqueName('Test Population', testSuiteId),
      code: createUniqueCode('TP'),
      description: 'Test population description',
      active: true,
    };

    testPopulation = await createPopulation(populationData);
    populationCleanup.track(testPopulation.id);
  });

  afterAll(async () => {
    // Cleanup all tracked populations
    await populationCleanup.cleanupAll();
  });

  describe('success scenarios', () => {
    test('should create a new population', async () => {
      const uniqueName = createUniqueName('New Test Population', testSuiteId);
      const uniqueCode = createUniqueCode('NTP');
      const populationData = {
        name: uniqueName,
        code: uniqueCode,
        description: 'New test population description',
        active: true,
      };

      const response = await createPopulation(populationData);
      populationCleanup.track(response.id);

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(populationData.name);
      expect(response.code).toBe(populationData.code);
      expect(response.description).toBe(populationData.description);
      expect(response.active).toBe(populationData.active);
      expect(response.createdAt).toBeDefined();
    });

    test('should retrieve a population by ID', async () => {
      const response = await getPopulation({ id: testPopulation.id });

      expect(response).toBeDefined();
      expect(response.id).toBe(testPopulation.id);
      expect(response.name).toBe(testPopulation.name);
      expect(response.code).toBe(testPopulation.code);
    });

    test('should update a population', async () => {
      const testPopulationForUpdate = await createTestPopulation(
        'Population to Update',
      );
      const updatedName = createUniqueName(
        'Updated Test Population',
        testSuiteId,
      );
      const updatedDescription = 'Updated description';

      const response = await updatePopulation({
        id: testPopulationForUpdate,
        name: updatedName,
        description: updatedDescription,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(testPopulationForUpdate);
      expect(response.name).toBe(updatedName);
      expect(response.description).toBe(updatedDescription);
    });

    test('should delete a population', async () => {
      const populationToDelete = await createTestPopulation(
        'Population To Delete',
      );

      await expect(
        deletePopulation({ id: populationToDelete }),
      ).resolves.not.toThrow();

      // No need to manually remove from tracking - cleanupHelper handles this
      await expect(getPopulation({ id: populationToDelete })).rejects.toThrow();
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors', async () => {
      await expect(getPopulation({ id: 9999 })).rejects.toThrow();
    });

    test('should handle duplicate errors', async () => {
      // Try to create population with same code as existing one
      await expect(
        createPopulation({
          name: createUniqueName('Different Name', testSuiteId),
          code: testPopulation.code, // Use the same code as existing population
          description: 'Duplicate test',
        }),
      ).rejects.toThrow();
    });

    describe('field validation errors', () => {
      test('should throw detailed field validation error for duplicate code', async () => {
        const duplicateCodePayload = {
          name: createUniqueName('Different Population Name', testSuiteId),
          code: testPopulation.code, // Same code as existing population
          description: 'Duplicate code test',
          active: true,
        };

        // Verify that the function rejects
        await expect(createPopulation(duplicateCodePayload)).rejects.toThrow();

        // Capture the error to make specific assertions
        let validationError: FieldValidationError | undefined;
        try {
          await createPopulation(duplicateCodePayload);
        } catch (error) {
          validationError = error as FieldValidationError;
        }

        expect(validationError).toBeDefined();
        const typedValidationError = validationError as FieldValidationError;
        expect(typedValidationError.name).toBe('FieldValidationError');
        expect(typedValidationError.message).toContain('Validation failed');

        expect(typedValidationError.fieldErrors).toBeDefined();
        expect(Array.isArray(typedValidationError.fieldErrors)).toBe(true);
        expect(typedValidationError.fieldErrors).toHaveLength(1);
        expect(typedValidationError.fieldErrors[0].field).toBe('code');
        expect(typedValidationError.fieldErrors[0].code).toBe('DUPLICATE');
        expect(typedValidationError.fieldErrors[0].message).toContain(
          'already exists',
        );
        expect(typedValidationError.fieldErrors[0].value).toBe(
          testPopulation.code,
        );
      });

      test('should handle update validation errors correctly', async () => {
        const anotherPopulation = await createTestPopulation(
          'Another Test Population',
        );

        const updatePayload = {
          id: anotherPopulation,
          code: testPopulation.code, // This should trigger duplicate validation
        };

        // Verify that the function rejects
        await expect(updatePopulation(updatePayload)).rejects.toThrow();

        // Capture the error to make specific assertions
        let validationError: FieldValidationError | undefined;
        try {
          await updatePopulation(updatePayload);
        } catch (error) {
          validationError = error as FieldValidationError;
        }

        expect(validationError).toBeDefined();
        const typedValidationError = validationError as FieldValidationError;
        expect(typedValidationError.name).toBe('FieldValidationError');
        expect(typedValidationError.message).toContain('Validation failed');
        expect(typedValidationError.fieldErrors).toBeDefined();
        expect(typedValidationError.fieldErrors[0].field).toBe('code');
        expect(typedValidationError.fieldErrors[0].code).toBe('DUPLICATE');
      });
    });
  });

  describe('pagination', () => {
    test('should return paginated populations with default parameters', async () => {
      const response = await listPopulationsPaginated({});

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
      const response = await listPopulationsPaginated({
        page: 1,
        pageSize: 5,
      });

      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
      expect(response.data.length).toBeLessThanOrEqual(5);
    });

    test('should default sort by name in ascending order', async () => {
      const populationA = await createTestPopulation('AAA Test Population');
      const populationZ = await createTestPopulation('ZZZ Test Population');

      const response = await listPopulationsPaginated({
        pageSize: 50,
      });

      const indexA = response.data.findIndex((p) => p.id === populationA);
      const indexZ = response.data.findIndex((p) => p.id === populationZ);

      if (indexA !== -1 && indexZ !== -1) {
        expect(indexA).toBeLessThan(indexZ);
      }
    });

    test('should return non-paginated list for dropdowns', async () => {
      const response = await listPopulations({});

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      expect(response).not.toHaveProperty('pagination');
    });
  });

  describe('search functionality', () => {
    // Add cleanup helper for search tests
    const searchCleanup = createCleanupHelper(
      deletePopulation,
      'search-population',
    );

    afterAll(async () => {
      await searchCleanup.cleanupAll();
    });

    test('should search populations using searchTerm in list endpoint', async () => {
      const searchablePopulation = await createPopulation({
        name: createUniqueName('Searchable Test Population', testSuiteId),
        code: createUniqueCode('STP'),
        description: 'A population for search testing',
        active: true,
      });
      searchCleanup.track(searchablePopulation.id);

      const response = await listPopulations({ searchTerm: 'Searchable' });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.some((p) => p.id === searchablePopulation.id)).toBe(
        true,
      );
    });

    test('should search populations with pagination using searchTerm', async () => {
      const response = await listPopulationsPaginated({
        searchTerm: 'Test',
        page: 1,
        pageSize: 5,
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
    });

    test('should combine search term with filters', async () => {
      const activeSearchablePopulation = await createPopulation({
        name: createUniqueName('Active Searchable Population', testSuiteId),
        code: createUniqueCode('ASP'),
        description: 'Active searchable test',
        active: true,
      });
      const inactiveSearchablePopulation = await createPopulation({
        name: createUniqueName('Inactive Searchable Population', testSuiteId),
        code: createUniqueCode('ISP'),
        description: 'Inactive searchable test',
        active: false,
      });
      searchCleanup.track(activeSearchablePopulation.id);
      searchCleanup.track(inactiveSearchablePopulation.id);

      const response = await listPopulations({
        searchTerm: 'Searchable',
        filters: { active: true },
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      // Should include the active searchable population
      expect(
        response.data.some((p) => p.id === activeSearchablePopulation.id),
      ).toBe(true);

      // Should NOT include the inactive searchable population
      expect(
        response.data.some((p) => p.id === inactiveSearchablePopulation.id),
      ).toBe(false);

      // All results should be active
      expect(response.data.every((p) => p.active === true)).toBe(true);
    });
  });

  describe('ordering and filtering', () => {
    const orderingCleanup = createCleanupHelper(
      deletePopulation,
      'ordering-population',
    );

    beforeAll(async () => {
      const populationsData = [
        {
          name: createUniqueName('Alpha Population', testSuiteId),
          code: createUniqueCode('AP'),
          description: 'Alpha desc',
          active: true,
        },
        {
          name: createUniqueName('Beta Population', testSuiteId),
          code: createUniqueCode('BP'),
          description: 'Beta desc',
          active: false,
        },
        {
          name: createUniqueName('Gamma Population', testSuiteId),
          code: createUniqueCode('GP'),
          description: 'Gamma desc',
          active: true,
        },
      ];

      for (const populationData of populationsData) {
        const population = await createPopulation(populationData);
        orderingCleanup.track(population.id);
      }
    });

    afterAll(async () => {
      await orderingCleanup.cleanupAll();
    });

    test('should order populations by name descending', async () => {
      const response = await listPopulations({
        orderBy: [{ field: 'name', direction: 'desc' }],
      });

      const names = response.data.map((p) => p.name);
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] >= names[i + 1]).toBe(true);
      }
    });

    test('should filter populations by active status', async () => {
      const response = await listPopulations({
        filters: { active: true },
      });

      expect(response.data.every((p) => p.active === true)).toBe(true);

      // Verify our active test populations are included
      const trackedIds = orderingCleanup.getTrackedIds();
      const activeTestPopulationIds = trackedIds
        .slice(0, 1)
        .concat(trackedIds.slice(2, 3)); // Alpha and Gamma are active
      for (const id of activeTestPopulationIds) {
        expect(response.data.some((p) => p.id === id)).toBe(true);
      }
    });

    test('should combine ordering and filtering in paginated results', async () => {
      const response = await listPopulationsPaginated({
        filters: { active: true },
        orderBy: [{ field: 'name', direction: 'asc' }],
        page: 1,
        pageSize: 10,
      });

      expect(response.data.every((p) => p.active === true)).toBe(true);

      const names = response.data.map((p) => p.name);
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] <= names[i + 1]).toBe(true);
      }

      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(10);
    });

    test('should allow multi-field ordering', async () => {
      const multiFieldCleanup = createCleanupHelper(
        deletePopulation,
        'multi-field-population',
      );

      const sameStatusPopulations = [
        {
          name: createUniqueName('Same Status A', testSuiteId),
          code: createUniqueCode('SSA'),
          description: 'Same A',
          active: true,
        },
        {
          name: createUniqueName('Same Status B', testSuiteId),
          code: createUniqueCode('SSB'),
          description: 'Same B',
          active: true,
        },
      ];

      for (const populationData of sameStatusPopulations) {
        const population = await createPopulation(populationData);
        multiFieldCleanup.track(population.id);
      }

      const response = await listPopulations({
        orderBy: [
          { field: 'active', direction: 'desc' },
          { field: 'name', direction: 'asc' },
        ],
      });

      const activePopulations = response.data.filter((p) => p.active === true);
      const activeNames = activePopulations.map((p) => p.name);

      for (let i = 0; i < activeNames.length - 1; i++) {
        if (activePopulations[i].active === activePopulations[i + 1].active) {
          expect(activeNames[i] <= activeNames[i + 1]).toBe(true);
        }
      }

      // Cleanup the populations created in this test
      await multiFieldCleanup.cleanupAll();
    });
  });

  describe('combined search and filtering', () => {
    test('should combine searchTerm with filters in non-paginated results', async () => {
      const searchableActivePopulation = await createTestPopulation(
        'SearchFilter Active Population',
        { active: true },
      );
      const searchableInactivePopulation = await createTestPopulation(
        'SearchFilter Inactive Population',
        { active: false },
      );

      const response = await listPopulations({
        searchTerm: 'SearchFilter',
        filters: { active: true },
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      // Should include the active population
      expect(
        response.data.some((p) => p.id === searchableActivePopulation),
      ).toBe(true);

      // Should NOT include the inactive population
      expect(
        response.data.some((p) => p.id === searchableInactivePopulation),
      ).toBe(false);

      // All results should be active
      expect(response.data.every((p) => p.active === true)).toBe(true);
    });

    test('should combine searchTerm with filters in paginated results', async () => {
      const searchableActivePopulation = await createTestPopulation(
        'PaginatedSearch Active Population',
        { active: true },
      );
      const searchableInactivePopulation = await createTestPopulation(
        'PaginatedSearch Inactive Population',
        { active: false },
      );

      const response = await listPopulationsPaginated({
        searchTerm: 'PaginatedSearch',
        filters: { active: true },
        page: 1,
        pageSize: 10,
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.pagination).toBeDefined();

      // Should include the active population
      expect(
        response.data.some((p) => p.id === searchableActivePopulation),
      ).toBe(true);

      // Should NOT include the inactive population
      expect(
        response.data.some((p) => p.id === searchableInactivePopulation),
      ).toBe(false);

      // All results should be active
      expect(response.data.every((p) => p.active === true)).toBe(true);
    });
  });

  describe('soft delete functionality', () => {
    test('should restore a soft deleted population', async () => {
      const testPopulationForRestore = await createTestPopulation(
        'Restore Test Population',
      );

      // Soft delete
      await deletePopulation({ id: testPopulationForRestore });
      await expect(
        getPopulation({ id: testPopulationForRestore }),
      ).rejects.toThrow();

      // Restore
      await populationRepository.restore(testPopulationForRestore);

      // Verify accessible again
      const found = await getPopulation({ id: testPopulationForRestore });
      expect(found.id).toBe(testPopulationForRestore);

      // Force delete for cleanup
      try {
        await populationRepository.forceDelete(testPopulationForRestore);
      } catch {
        // Ignore cleanup errors
      }
    });

    test('should force delete a population permanently', async () => {
      const testPopulationForForceDelete = await createTestPopulation(
        'Force Delete Test Population',
      );

      // Force delete
      await populationRepository.forceDelete(testPopulationForForceDelete);

      // Verify completely gone
      await expect(
        getPopulation({ id: testPopulationForForceDelete }),
      ).rejects.toThrow();
      await expect(
        populationRepository.findOne(testPopulationForForceDelete),
      ).rejects.toThrow();
    });
  });

  describe('city assignment', () => {
    const factoryDb = getFactoryDb(db);
    const cityAssignmentCleanup = createCleanupHelper(
      deletePopulation,
      'city-assignment-population',
    );

    // Test data
    let testCountry: Country;
    let testState: State;
    const testCities: City[] = [];
    let testPopulationForCityAssignment: Population;

    beforeAll(async () => {
      const ID_OFFSET = 500;
      // Create test dependencies using factories
      testCountry = (await countryFactory(factoryDb).create({
        id: ID_OFFSET,
        name: createUniqueName('Test Country for City Assignment', testSuiteId),
        code: `TCA${testSuiteId.substring(0, 4)}`,
      })) as Country;

      testState = (await stateFactory(factoryDb).create({
        id: ID_OFFSET,
        name: createUniqueName('Test State for City Assignment', testSuiteId),
        code: `TSA${testSuiteId.substring(0, 4)}`,
        countryId: testCountry.id,
      })) as State;

      // Create test cities using factory
      for (let i = 0; i < 4; i++) {
        const city = (await cityFactory(factoryDb).create({
          id: ID_OFFSET + i,
          name: createUniqueName(`Test City ${i + 1}`, testSuiteId),
          stateId: testState.id,
          timezone: 'America/Mexico_City',
          latitude: 19.4326 + i,
          longitude: -99.1332 + i,
        })) as City;
        testCities.push(city);
      }

      // Create test population for city assignment tests
      testPopulationForCityAssignment = await createPopulation({
        name: createUniqueName(
          'Test Population for City Assignment',
          testSuiteId,
        ),
        code: createUniqueCode('TPCA'),
        description: 'Test population for city assignment tests',
        active: true,
      });
      cityAssignmentCleanup.track(testPopulationForCityAssignment.id);
    });

    afterAll(async () => {
      // Clean up test population
      await cityAssignmentCleanup.cleanupAll();

      // Clean up factory-created entities in reverse order of dependencies
      // First clean up cities (they have foreign keys to states)
      for (const city of testCities) {
        if (city?.id) {
          try {
            await cityRepository.delete(city.id);
          } catch (error) {
            console.log('Error cleaning up test city:', error);
          }
        }
      }

      // Then clean up state (it has foreign key to country)
      if (testState?.id) {
        try {
          await stateRepository.delete(testState.id);
        } catch (error) {
          console.log('Error cleaning up test state:', error);
        }
      }

      // Finally clean up country
      if (testCountry?.id) {
        try {
          await countryRepository.delete(testCountry.id);
        } catch (error) {
          console.log('Error cleaning up test country:', error);
        }
      }
    });

    test('should assign cities to a population', async () => {
      const cityIds = [testCities[0].id, testCities[1].id];

      // Should not throw an error
      await expect(
        assignCitiesToPopulation({
          id: testPopulationForCityAssignment.id,
          cityIds,
        }),
      ).resolves.not.toThrow();
    });

    test('should replace existing city assignments', async () => {
      // First assign two cities
      const initialCityIds = [testCities[0].id, testCities[1].id];
      await assignCitiesToPopulation({
        id: testPopulationForCityAssignment.id,
        cityIds: initialCityIds,
      });

      // Then assign different cities (should replace previous assignment)
      const newCityIds = [testCities[2].id, testCities[3].id];
      await expect(
        assignCitiesToPopulation({
          id: testPopulationForCityAssignment.id,
          cityIds: newCityIds,
        }),
      ).resolves.not.toThrow();
    });

    test('should handle empty city array (remove all assignments)', async () => {
      // First assign some cities
      await assignCitiesToPopulation({
        id: testPopulationForCityAssignment.id,
        cityIds: [testCities[0].id],
      });

      // Then remove all assignments
      await expect(
        assignCitiesToPopulation({
          id: testPopulationForCityAssignment.id,
          cityIds: [],
        }),
      ).resolves.not.toThrow();
    });

    test('should reject duplicate city IDs', async () => {
      const duplicateCityIds = [testCities[0].id, testCities[0].id];

      await expectFieldValidationError(
        () =>
          assignCitiesToPopulation({
            id: testPopulationForCityAssignment.id,
            cityIds: duplicateCityIds,
          }),
        'cityIds',
        'DUPLICATE',
        'Duplicate city IDs are not allowed in the assignment',
      );
    });

    test('should reject non-existent population ID', async () => {
      const cityIds = [testCities[0].id];

      await expectFieldValidationError(
        () => assignCitiesToPopulation({ id: 99999, cityIds }),
        'populationId',
        'NOT_FOUND',
        'Population with id 99999 not found',
      );
    });

    test('should reject non-existent city IDs', async () => {
      const nonExistentCityIds = [99999, 99998];

      await expectFieldValidationError(
        () =>
          assignCitiesToPopulation({
            id: testPopulationForCityAssignment.id,
            cityIds: nonExistentCityIds,
          }),
        'cityIds',
        'NOT_FOUND',
        'Cities with IDs [99999, 99998] not found',
      );
    });

    test('should handle partial non-existent city IDs', async () => {
      const mixedCityIds = [testCities[0].id, 99999];

      await expectFieldValidationError(
        () =>
          assignCitiesToPopulation({
            id: testPopulationForCityAssignment.id,
            cityIds: mixedCityIds,
          }),
        'cityIds',
        'NOT_FOUND',
        'Cities with IDs [99999] not found',
      );
    });
  });
});
