import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createSlug } from '../../shared/utils';
import {
  cityFactory,
  countryFactory,
  populationFactory,
  stateFactory,
} from '../../tests/factories';
import { getFactoryDb } from '../../tests/factories/factory-utils';
import {
  createCleanupHelper,
  createTestSuiteId,
  createUniqueCode,
  createUniqueName,
} from '../../tests/shared/test-utils';
import { countryRepository } from '../countries/countries.repository';
import type { Country } from '../countries/countries.types';
import { db } from '../db-service';
import {
  assignCitiesToPopulation,
  deletePopulation,
} from '../populations/populations.controller';
import type { Population } from '../populations/populations.types';
import { stateRepository } from '../states/states.repository';
import type { State } from '../states/states.types';
import type { City } from './cities.types';
import {
  createCity,
  deleteCity,
  getCity,
  listCities,
  listCitiesPaginated,
  updateCity,
} from './cities.controller';

describe('Cities Controller', () => {
  const testSuiteId = createTestSuiteId('cities-controller');
  const factoryDb = getFactoryDb(db);

  let testCountry: Country;
  let testState: State;
  let testCity: City;

  // Cleanup helpers using test-utils
  const cityCleanup = createCleanupHelper(deleteCity, 'city');

  const createTestCity = async (baseName: string, options = {}) => {
    const uniqueName = createUniqueName(baseName, testSuiteId);
    const city = await createCity({
      name: uniqueName,
      stateId: testState.id,
      timezone: 'America/Mexico_City',
      latitude: 19.4326,
      longitude: -99.1332,
      ...options,
    });
    return cityCleanup.track(city.id);
  };

  beforeAll(async () => {
    // Create test dependencies using factories
    testCountry = (await countryFactory(factoryDb).create({
      name: createUniqueName('Test Country for Cities', testSuiteId),
      code: `TCC${testSuiteId.substring(0, 4)}`,
      deletedAt: null,
    })) as Country;

    testState = (await stateFactory(factoryDb).create({
      name: createUniqueName('Test State for Cities', testSuiteId),
      code: `TSC${testSuiteId.substring(0, 4)}`,
      countryId: testCountry.id,
      deletedAt: null,
    })) as State;

    // Create a test city for reuse in multiple tests
    testCity = (await cityFactory(factoryDb).create({
      name: createUniqueName('Test City', testSuiteId),
      stateId: testState.id,
      timezone: 'America/Mexico_City',
      latitude: 19.4326,
      longitude: -99.1332,
      deletedAt: null,
    })) as City;
    cityCleanup.track(testCity.id);
  });

  afterAll(async () => {
    // Cleanup all tracked cities first (due to foreign key constraints)
    await cityCleanup.cleanupAll();

    // Cleanup factory-created entities in reverse order of dependencies
    if (testState?.id) {
      try {
        await stateRepository.delete(testState.id);
      } catch (error) {
        console.log('Error cleaning up test state:', error);
      }
    }

    if (testCountry?.id) {
      try {
        await countryRepository.delete(testCountry.id);
      } catch (error) {
        console.log('Error cleaning up test country:', error);
      }
    }
  });

  describe('success scenarios', () => {
    test('should create a new city with auto-generated slug', async () => {
      const uniqueName = createUniqueName('New Test City', testSuiteId);
      const cityData = {
        name: uniqueName,
        stateId: testState.id,
        timezone: 'America/Mexico_City',
        active: true,
        latitude: 19.4326,
        longitude: -99.1332,
      };

      const response = await createCity(cityData);
      cityCleanup.track(response.id);

      const expectedSlug = createSlug(uniqueName);
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(uniqueName);
      expect(response.slug).toBe(expectedSlug);
      expect(response.stateId).toBe(testState.id);
      expect(response.timezone).toBe(cityData.timezone);
      expect(response.active).toBe(cityData.active);
      expect(response.latitude).toBe(cityData.latitude);
      expect(response.longitude).toBe(cityData.longitude);
      expect(response.createdAt).toBeDefined();
    });

    test('should retrieve a city by ID with state, country, and populations relations', async () => {
      const response = await getCity({ id: testCity.id });

      expect(response).toBeDefined();
      expect(response.id).toBe(testCity.id);
      expect(response.name).toBe(testCity.name);
      expect(response.stateId).toBe(testState.id);
      expect(response.latitude).toBe(testCity.latitude);
      expect(response.longitude).toBe(testCity.longitude);

      // Verify state relation is included
      expect(response.state).toBeDefined();
      expect(response.state.id).toBe(testState.id);
      expect(response.state.name).toBe(testState.name);
      expect(response.state.countryId).toBe(testCountry.id);

      // Verify country relation is included through state
      expect(response.state.country).toBeDefined();
      expect(response.state.country.id).toBe(testCountry.id);
      expect(response.state.country.name).toBe(testCountry.name);

      // Verify populations relation is included (should be empty array initially)
      expect(response.populations).toBeDefined();
      expect(Array.isArray(response.populations)).toBe(true);
      expect(response.populations).toHaveLength(0);
    });

    test('should retrieve a city with assigned populations', async () => {
      // Create a test city for population assignment
      const testCityForPopulations = await createTestCity(
        'City with Populations',
      );

      // Create test populations using the factory
      const factoryDb = getFactoryDb(db);
      const testPopulation1 = (await populationFactory(factoryDb).create({
        name: createUniqueName('Test Population 1', testSuiteId),
        code: createUniqueCode('TP1'),
        description: 'First test population',
        active: true,
        deletedAt: null,
      })) as Population;

      const testPopulation2 = (await populationFactory(factoryDb).create({
        name: createUniqueName('Test Population 2', testSuiteId),
        code: createUniqueCode('TP2'),
        description: 'Second test population',
        active: true,
        deletedAt: null,
      })) as Population;

      // Create cleanup helper for test populations
      const populationCleanup = createCleanupHelper(
        deletePopulation,
        'test-population',
      );
      populationCleanup.track(testPopulation1.id);
      populationCleanup.track(testPopulation2.id);

      try {
        // Assign the city to both populations
        await assignCitiesToPopulation({
          id: testPopulation1.id,
          cityIds: [testCityForPopulations],
        });

        await assignCitiesToPopulation({
          id: testPopulation2.id,
          cityIds: [testCityForPopulations],
        });

        // Retrieve the city with populations
        const response = await getCity({ id: testCityForPopulations });

        expect(response).toBeDefined();
        expect(response.id).toBe(testCityForPopulations);

        // Verify populations are included and correctly structured
        expect(response.populations).toBeDefined();
        expect(Array.isArray(response.populations)).toBe(true);
        expect(response.populations).toHaveLength(2);

        // Verify population structure and content
        const populationIds = response.populations.map((p) => p.id);
        expect(populationIds).toContain(testPopulation1.id);
        expect(populationIds).toContain(testPopulation2.id);

        // Verify each population has the expected properties
        response.populations.forEach((population) => {
          expect(population.id).toBeDefined();
          expect(population.name).toBeDefined();
          expect(population.code).toBeDefined();
          expect(population.description).toBeDefined();
          expect(typeof population.active).toBe('boolean');
          expect(population.createdAt).toBeDefined();
          expect(population.updatedAt).toBeDefined();
        });

        // Verify specific population data
        const population1 = response.populations.find(
          (p) => p.id === testPopulation1.id,
        );
        const population2 = response.populations.find(
          (p) => p.id === testPopulation2.id,
        );

        expect(population1).toBeDefined();
        expect(population1?.name).toBe(testPopulation1.name);
        expect(population1?.code).toBe(testPopulation1.code);

        expect(population2).toBeDefined();
        expect(population2?.name).toBe(testPopulation2.name);
        expect(population2?.code).toBe(testPopulation2.code);
      } finally {
        // Clean up test populations
        await populationCleanup.cleanupAll();
      }
    });

    test('should update a city name and regenerate the slug', async () => {
      const testCityForUpdate = await createTestCity('City to Update');
      const updatedName = createUniqueName('Updated Test City', testSuiteId);

      const response = await updateCity({
        id: testCityForUpdate,
        name: updatedName,
      });

      const expectedSlug = createSlug(updatedName);
      expect(response).toBeDefined();
      expect(response.id).toBe(testCityForUpdate);
      expect(response.name).toBe(updatedName);
      expect(response.slug).toBe(expectedSlug);
      expect(response.stateId).toBe(testState.id);
    });

    test('should update city latitude', async () => {
      const testCityForUpdate = await createTestCity(
        'City for Latitude Update',
      );
      const newLatitude = 20.967;

      const response = await updateCity({
        id: testCityForUpdate,
        latitude: newLatitude,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(testCityForUpdate);
      expect(response.latitude).toBe(newLatitude);
    });

    test('should update city longitude', async () => {
      const testCityForUpdate = await createTestCity(
        'City for Longitude Update',
      );
      const newLongitude = -89.5926;

      const response = await updateCity({
        id: testCityForUpdate,
        longitude: newLongitude,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(testCityForUpdate);
      expect(response.longitude).toBe(newLongitude);
    });

    test('should delete a city', async () => {
      const cityToDelete = await createTestCity('City To Delete');

      await expect(deleteCity({ id: cityToDelete })).resolves.not.toThrow();

      // No need to manually remove from tracking - cleanupHelper handles this
      await expect(getCity({ id: cityToDelete })).rejects.toThrow();
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors', async () => {
      await expect(getCity({ id: 9999 })).rejects.toThrow();
    });

    test('should handle duplicate city names', async () => {
      const duplicateTestName = 'Cities Controller Duplicate Test City Name';
      const firstCity = await createCity({
        name: duplicateTestName,
        stateId: testState.id,
        timezone: 'America/Mexico_City',
        latitude: 19.4326,
        longitude: -99.1332,
      });
      cityCleanup.track(firstCity.id);

      await expect(
        createCity({
          name: duplicateTestName, // Use the same name to test duplicates
          stateId: testState.id,
          timezone: 'America/Mexico_City',
          latitude: 20.123,
          longitude: -98.456,
        }),
      ).rejects.toThrow();
    });

    test('should handle duplicate city names with different casing', async () => {
      const caseTestName = 'Cities Controller Case Sensitive Test City';
      const firstCity = await createCity({
        name: caseTestName,
        stateId: testState.id,
        timezone: 'America/Mexico_City',
        latitude: 19.4326,
        longitude: -99.1332,
      });
      cityCleanup.track(firstCity.id);

      await expect(
        createCity({
          name: caseTestName.toUpperCase(), // Use uppercase version of the same name
          stateId: testState.id,
          timezone: 'America/Mexico_City',
          latitude: 20.123,
          longitude: -98.456,
        }),
      ).rejects.toThrow();
    });

    test('should handle duplicate city names with accents', async () => {
      const accentTestName = 'Cities Controller Méxicó Test City';
      const firstCity = await createCity({
        name: accentTestName,
        stateId: testState.id,
        timezone: 'America/Mexico_City',
        latitude: 19.4326,
        longitude: -99.1332,
      });
      cityCleanup.track(firstCity.id);

      await expect(
        createCity({
          name: 'Cities Controller Mexico Test City', // Without accents but same slug
          stateId: testState.id,
          timezone: 'America/Mexico_City',
          latitude: 20.123,
          longitude: -98.456,
        }),
      ).rejects.toThrow();
    });

    test('should handle invalid state ID', async () => {
      await expect(
        createCity({
          name: createUniqueName('Invalid State City', testSuiteId),
          stateId: 9999,
          timezone: 'America/Mexico_City',
          latitude: 19.4326,
          longitude: -99.1332,
        }),
      ).rejects.toThrow();
    });

    test('should handle missing latitude', async () => {
      const invalidPayload = {
        name: createUniqueName('Missing Latitude City', testSuiteId),
        stateId: testState.id,
        timezone: 'America/Mexico_City',
        longitude: -99.1332,
      };

      // @ts-expect-error Intentionally missing required field
      await expect(createCity(invalidPayload)).rejects.toThrow();
    });
  });

  describe('pagination', () => {
    test('should return paginated cities with default parameters', async () => {
      const response = await listCitiesPaginated({});

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
      const response = await listCitiesPaginated({
        page: 1,
        pageSize: 5,
      });

      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
      expect(response.data.length).toBeLessThanOrEqual(5);
    });

    test('should default sort by name in ascending order', async () => {
      const cityA = await createTestCity('AAA Test City');
      const cityZ = await createTestCity('ZZZ Test City');

      const response = await listCitiesPaginated({
        pageSize: 50,
      });

      const indexA = response.data.findIndex((c) => c.id === cityA);
      const indexZ = response.data.findIndex((c) => c.id === cityZ);

      if (indexA !== -1 && indexZ !== -1) {
        expect(indexA).toBeLessThan(indexZ);
      }
    });

    test('should return non-paginated list for dropdowns', async () => {
      const response = await listCities({});

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      expect(response).not.toHaveProperty('pagination');
    });
  });

  describe('search functionality', () => {
    // Add cleanup helper for search tests
    const searchCleanup = createCleanupHelper(deleteCity, 'search-city');

    afterAll(async () => {
      await searchCleanup.cleanupAll();
    });

    test('should search cities', async () => {
      const searchableCity = await createCity({
        name: createUniqueName('Searchable Test City', testSuiteId),
        stateId: testState.id,
        timezone: 'America/Mexico_City',
        latitude: 19.4326,
        longitude: -99.1332,
      });
      searchCleanup.track(searchableCity.id);

      const response = await listCities({ searchTerm: 'Searchable' });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.some((c) => c.id === searchableCity.id)).toBe(true);
    });

    test('should search cities with pagination', async () => {
      const response = await listCitiesPaginated({
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
  });

  describe('ordering and filtering', () => {
    const orderingCityCleanup = createCleanupHelper(
      deleteCity,
      'ordering-city',
    );

    beforeAll(async () => {
      const citiesData = [
        {
          name: createUniqueName('Alpha City', testSuiteId),
          latitude: 10,
          longitude: 10,
          active: true,
        },
        {
          name: createUniqueName('Beta City', testSuiteId),
          latitude: 20,
          longitude: 20,
          active: false,
        },
        {
          name: createUniqueName('Gamma City', testSuiteId),
          latitude: 30,
          longitude: 30,
          active: true,
        },
      ];

      for (const cityData of citiesData) {
        const city = await createCity({
          ...cityData,
          stateId: testState.id,
          timezone: 'America/Mexico_City',
        });
        orderingCityCleanup.track(city.id);
      }
    });

    afterAll(async () => {
      await orderingCityCleanup.cleanupAll();
    });

    test('should order cities by name descending', async () => {
      const response = await listCities({
        orderBy: [{ field: 'name', direction: 'desc' }],
      });

      const names = response.data.map((c) => c.name);
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] >= names[i + 1]).toBe(true);
      }
    });

    test('should filter cities by active status', async () => {
      const response = await listCities({
        filters: { active: true },
      });

      expect(response.data.every((c) => c.active === true)).toBe(true);

      // Verify our active test cities are included
      const trackedIds = orderingCityCleanup.getTrackedIds();
      const activeTestCityIds = trackedIds
        .slice(0, 1)
        .concat(trackedIds.slice(2, 3)); // Alpha and Gamma are active
      for (const id of activeTestCityIds) {
        expect(response.data.some((c) => c.id === id)).toBe(true);
      }
    });

    test('should combine ordering and filtering in paginated results', async () => {
      const response = await listCitiesPaginated({
        filters: { active: true },
        orderBy: [{ field: 'name', direction: 'asc' }],
        page: 1,
        pageSize: 10,
      });

      expect(response.data.every((c) => c.active === true)).toBe(true);

      const names = response.data.map((c) => c.name);
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] <= names[i + 1]).toBe(true);
      }

      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(10);
    });

    test('should allow multi-field ordering', async () => {
      const multiFieldCleanup = createCleanupHelper(
        deleteCity,
        'multi-field-city',
      );

      const sameStatusCities = [
        {
          name: createUniqueName('Same Status A', testSuiteId),
          latitude: 1,
          longitude: 1,
          active: true,
        },
        {
          name: createUniqueName('Same Status B', testSuiteId),
          latitude: 2,
          longitude: 2,
          active: true,
        },
      ];

      for (const cityData of sameStatusCities) {
        const city = await createCity({
          ...cityData,
          stateId: testState.id,
          timezone: 'America/Mexico_City',
        });
        multiFieldCleanup.track(city.id);
      }

      const response = await listCities({
        orderBy: [
          { field: 'active', direction: 'desc' },
          { field: 'name', direction: 'asc' },
        ],
      });

      const activeCities = response.data.filter((c) => c.active === true);
      const activeNames = activeCities.map((c) => c.name);

      for (let i = 0; i < activeNames.length - 1; i++) {
        if (activeCities[i].active === activeCities[i + 1].active) {
          expect(activeNames[i] <= activeNames[i + 1]).toBe(true);
        }
      }

      // Cleanup the cities created in this test
      await multiFieldCleanup.cleanupAll();
    });
  });

  describe('combined search and filtering', () => {
    test('should combine searchTerm with filters in non-paginated results', async () => {
      // Create test cities with specific patterns
      const searchableActiveCity = await createTestCity(
        'SearchFilter Active City',
        { active: true },
      );
      const searchableInactiveCity = await createTestCity(
        'SearchFilter Inactive City',
        { active: false },
      );

      // Search for "SearchFilter" but only active cities
      const response = await listCities({
        searchTerm: 'SearchFilter',
        filters: { active: true },
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      // Should include the active city
      expect(response.data.some((c) => c.id === searchableActiveCity)).toBe(
        true,
      );

      // Should NOT include the inactive city
      expect(response.data.some((c) => c.id === searchableInactiveCity)).toBe(
        false,
      );

      // All results should be active
      expect(response.data.every((c) => c.active === true)).toBe(true);
    });

    test('should combine searchTerm with filters in paginated results', async () => {
      // Create test cities with specific patterns
      const searchableActiveCity = await createTestCity(
        'PaginatedSearch Active City',
        { active: true },
      );
      const searchableInactiveCity = await createTestCity(
        'PaginatedSearch Inactive City',
        { active: false },
      );

      // Search for "PaginatedSearch" but only active cities with pagination
      const response = await listCitiesPaginated({
        searchTerm: 'PaginatedSearch',
        filters: { active: true },
        page: 1,
        pageSize: 10,
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.pagination).toBeDefined();

      // Should include the active city
      expect(response.data.some((c) => c.id === searchableActiveCity)).toBe(
        true,
      );

      // Should NOT include the inactive city
      expect(response.data.some((c) => c.id === searchableInactiveCity)).toBe(
        false,
      );

      // All results should be active
      expect(response.data.every((c) => c.active === true)).toBe(true);
    });
  });
});
