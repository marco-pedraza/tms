import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createSlug } from '../../shared/utils';
import {
  createCountry,
  deleteCountry,
} from '../countries/countries.controller';
import { createState, deleteState } from '../states/states.controller';
import {
  createCity,
  deleteCity,
  getCity,
  listCities,
  listCitiesPaginated,
  searchCities,
  searchCitiesPaginated,
  updateCity,
} from './cities.controller';

describe('Cities Controller', () => {
  let countryId: number;
  let stateId: number;

  const testCity = {
    name: 'Test City',
    stateId: 0,
    timezone: 'America/Mexico_City',
    active: true,
    latitude: 19.4326,
    longitude: -99.1332,
  };

  let createdCityId: number;
  const createdCityIds: number[] = [];

  const trackCity = (id: number) => {
    if (!createdCityIds.includes(id)) {
      createdCityIds.push(id);
    }
    return id;
  };

  const cleanupCity = async (id: number) => {
    try {
      await deleteCity({ id });
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('not found'))) {
        console.log(`Error cleaning up city (ID: ${id}):`, error);
      }
    }
    const index = createdCityIds.indexOf(id);
    if (index > -1) {
      createdCityIds.splice(index, 1);
    }
  };

  const createTestCity = async (name: string, options = {}) => {
    const city = await createCity({
      name,
      stateId: testCity.stateId,
      timezone: 'America/Mexico_City',
      latitude: 19.4326,
      longitude: -99.1332,
      ...options,
    });
    return trackCity(city.id);
  };

  beforeAll(async () => {
    const country = await createCountry({
      name: 'Test Country for Cities',
      code: 'TCC',
      active: true,
    });
    countryId = country.id;

    const state = await createState({
      name: 'Test State for Cities',
      code: 'TSC',
      countryId,
      active: true,
    });
    stateId = state.id;
    testCity.stateId = stateId;
  });

  afterAll(async () => {
    for (const id of [...createdCityIds]) {
      await cleanupCity(id);
    }

    if (createdCityId && !createdCityIds.includes(createdCityId)) {
      await cleanupCity(createdCityId);
    }

    if (stateId) {
      try {
        await deleteState({ id: stateId });
      } catch (error) {
        console.log('Error cleaning up test state:', error);
      }
    }

    if (countryId) {
      try {
        await deleteCountry({ id: countryId });
      } catch (error) {
        console.log('Error cleaning up test country:', error);
      }
    }
  });

  describe('success scenarios', () => {
    test('should create a new city with auto-generated slug', async () => {
      const response = await createCity(testCity);
      createdCityId = response.id;
      trackCity(createdCityId);

      const expectedSlug = createSlug(testCity.name);
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(testCity.name);
      expect(response.slug).toBe(expectedSlug);
      expect(response.stateId).toBe(testCity.stateId);
      expect(response.timezone).toBe(testCity.timezone);
      expect(response.active).toBe(testCity.active);
      expect(response.latitude).toBe(testCity.latitude);
      expect(response.longitude).toBe(testCity.longitude);
      expect(response.createdAt).toBeDefined();
    });

    test('should retrieve a city by ID', async () => {
      const response = await getCity({ id: createdCityId });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdCityId);
      expect(response.name).toBe(testCity.name);
      expect(response.stateId).toBe(testCity.stateId);
      expect(response.latitude).toBe(testCity.latitude);
      expect(response.longitude).toBe(testCity.longitude);
    });

    test('should update a city name and regenerate the slug', async () => {
      const updatedName = 'Updated Test City';
      const response = await updateCity({
        id: createdCityId,
        name: updatedName,
      });

      const expectedSlug = createSlug(updatedName);
      expect(response).toBeDefined();
      expect(response.id).toBe(createdCityId);
      expect(response.name).toBe(updatedName);
      expect(response.slug).toBe(expectedSlug);
      expect(response.stateId).toBe(testCity.stateId);
      expect(response.latitude).toBe(testCity.latitude);
      expect(response.longitude).toBe(testCity.longitude);
    });

    test('should update city latitude', async () => {
      const newLatitude = 20.967;
      const response = await updateCity({
        id: createdCityId,
        latitude: newLatitude,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdCityId);
      expect(response.latitude).toBe(newLatitude);
      expect(response.longitude).toBe(testCity.longitude);
    });

    test('should update city longitude', async () => {
      const newLongitude = -89.5926;
      const response = await updateCity({
        id: createdCityId,
        longitude: newLongitude,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdCityId);
      expect(response.longitude).toBe(newLongitude);
    });

    test('should delete a city', async () => {
      const cityId = await createTestCity('City To Delete');

      await expect(deleteCity({ id: cityId })).resolves.not.toThrow();

      const index = createdCityIds.indexOf(cityId);
      if (index > -1) {
        createdCityIds.splice(index, 1);
      }

      await expect(getCity({ id: cityId })).rejects.toThrow();
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors', async () => {
      await expect(getCity({ id: 9999 })).rejects.toThrow();
    });

    test('should handle duplicate city names', async () => {
      const uniqueName = 'Unique Test City';
      const cityId = await createTestCity(uniqueName);

      try {
        await expect(
          createCity({
            name: uniqueName,
            stateId: testCity.stateId,
            timezone: 'America/Mexico_City',
            latitude: 20.123,
            longitude: -98.456,
          }),
        ).rejects.toThrow();
      } finally {
        await cleanupCity(cityId);
      }
    });

    test('should handle duplicate city names with different casing', async () => {
      const caseName = 'Case Sensitive City';
      const cityId = await createTestCity(caseName);

      try {
        await expect(
          createCity({
            name: caseName.toUpperCase(),
            stateId: testCity.stateId,
            timezone: 'America/Mexico_City',
            latitude: 20.123,
            longitude: -98.456,
          }),
        ).rejects.toThrow();
      } finally {
        await cleanupCity(cityId);
      }
    });

    test('should handle duplicate city names with accents', async () => {
      const cityId = await createTestCity('Méxicó City');

      try {
        await expect(
          createCity({
            name: 'Mexico City',
            stateId: testCity.stateId,
            timezone: 'America/Mexico_City',
            latitude: 20.123,
            longitude: -98.456,
          }),
        ).rejects.toThrow();
      } finally {
        await cleanupCity(cityId);
      }
    });

    test('should handle invalid state ID', async () => {
      await expect(
        createCity({
          name: 'Invalid State City',
          stateId: 9999,
          timezone: 'America/Mexico_City',
          latitude: 19.4326,
          longitude: -99.1332,
        }),
      ).rejects.toThrow();
    });

    test('should handle missing latitude', async () => {
      const invalidPayload = {
        name: 'Missing Latitude City',
        stateId: stateId,
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
      const cityAId = await createTestCity('AAA Test City');
      const cityZId = await createTestCity('ZZZ Test City');

      try {
        const response = await listCitiesPaginated({
          pageSize: 50,
        });

        const indexA = response.data.findIndex((c) => c.id === cityAId);
        const indexZ = response.data.findIndex((c) => c.id === cityZId);

        if (indexA !== -1 && indexZ !== -1) {
          expect(indexA).toBeLessThan(indexZ);
        }
      } finally {
        await cleanupCity(cityAId);
        await cleanupCity(cityZId);
      }
    });

    test('should return non-paginated list for dropdowns', async () => {
      const response = await listCities({});

      expect(response.cities).toBeDefined();
      expect(Array.isArray(response.cities)).toBe(true);
      expect(response.cities.length).toBeGreaterThan(0);
      expect(response).not.toHaveProperty('pagination');
    });
  });

  describe('search functionality', () => {
    test('should search cities', async () => {
      const searchableCityId = await createTestCity('Searchable Test City');

      try {
        const response = await searchCities({ term: 'Searchable' });

        expect(response.cities).toBeDefined();
        expect(Array.isArray(response.cities)).toBe(true);
        expect(response.cities.some((c) => c.id === searchableCityId)).toBe(
          true,
        );
      } finally {
        await cleanupCity(searchableCityId);
      }
    });

    test('should search cities with pagination', async () => {
      const response = await searchCitiesPaginated({
        term: 'Test',
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
    const testCities: number[] = [];

    beforeAll(async () => {
      const cities = [
        {
          name: 'Alpha City',
          stateId,
          latitude: 10,
          longitude: 10,
          timezone: 'America/Mexico_City',
          active: true,
        },
        {
          name: 'Beta City',
          stateId,
          latitude: 20,
          longitude: 20,
          timezone: 'America/Mexico_City',
          active: false,
        },
        {
          name: 'Gamma City',
          stateId,
          latitude: 30,
          longitude: 30,
          timezone: 'America/Mexico_City',
          active: true,
        },
      ];

      for (const city of cities) {
        const created = await createCity(city);
        testCities.push(created.id);
        trackCity(created.id);
      }
    });

    afterAll(async () => {
      for (const id of testCities) {
        await cleanupCity(id);
      }
    });

    test('should order cities by name descending', async () => {
      const response = await listCities({
        orderBy: [{ field: 'name', direction: 'desc' }],
      });

      const names = response.cities.map((c) => c.name);
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] >= names[i + 1]).toBe(true);
      }
    });

    test('should filter cities by active status', async () => {
      const response = await listCities({
        filters: { active: true },
      });

      expect(response.cities.every((c) => c.active === true)).toBe(true);

      const activeTestCityIds: number[] = [];
      for (const id of testCities) {
        const city = await getCity({ id });
        if (city.active) {
          activeTestCityIds.push(id);
        }
      }

      for (const id of activeTestCityIds) {
        expect(response.cities.some((c) => c.id === id)).toBe(true);
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
      const sameActiveStatusCities = [
        {
          name: 'Same Status A',
          stateId,
          latitude: 1,
          longitude: 1,
          timezone: 'America/Mexico_City',
          active: true,
        },
        {
          name: 'Same Status B',
          stateId,
          latitude: 2,
          longitude: 2,
          timezone: 'America/Mexico_City',
          active: true,
        },
      ];

      const createdCities: number[] = [];

      try {
        for (const city of sameActiveStatusCities) {
          const created = await createCity(city);
          createdCities.push(created.id);
          trackCity(created.id);
        }

        const response = await listCities({
          orderBy: [
            { field: 'active', direction: 'desc' },
            { field: 'name', direction: 'asc' },
          ],
        });

        const activeCities = response.cities.filter((c) => c.active === true);
        const activeNames = activeCities.map((c) => c.name);

        for (let i = 0; i < activeNames.length - 1; i++) {
          if (activeCities[i].active === activeCities[i + 1].active) {
            expect(activeNames[i] <= activeNames[i + 1]).toBe(true);
          }
        }
      } finally {
        for (const id of createdCities) {
          await cleanupCity(id);
        }
      }
    });
  });
});
