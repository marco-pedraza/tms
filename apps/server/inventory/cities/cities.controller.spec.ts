import { expect, describe, test, beforeAll, afterAll } from 'vitest';
import {
  createCity,
  getCity,
  listCitiesPaginated,
  updateCity,
  deleteCity,
} from './cities.controller';
import { createState, deleteState } from '../states/states.controller';
import {
  createCountry,
  deleteCountry,
} from '../countries/countries.controller';

describe('Cities Controller', () => {
  // Test data and setup
  let countryId: number; // We need a valid country ID for state tests
  let stateId: number; // We need a valid state ID for city tests
  const testCity = {
    name: 'Test City',
    stateId: 0, // This will be populated in beforeAll
    slug: 'test-city',
    timezone: 'America/Mexico_City',
    active: true,
    latitude: 19.4326,
    longitude: -99.1332,
  };

  // Variable to store created IDs for cleanup
  let createdCityId: number;

  // Create a test country and state before running the city tests
  beforeAll(async () => {
    // Create a temporary country for the state
    const country = await createCountry({
      name: 'Test Country for Cities',
      code: 'TCC',
      active: true,
    });
    countryId = country.id;

    // Create a temporary state to use for the city tests
    const state = await createState({
      name: 'Test State for Cities',
      code: 'TSC',
      countryId,
      active: true,
    });

    stateId = state.id;
    testCity.stateId = stateId; // Update the test city with the real state ID
  });

  // Clean up after all tests
  afterAll(async () => {
    // Clean up the created city if any
    if (createdCityId) {
      try {
        await deleteCity({ id: createdCityId });
      } catch (error) {
        console.log('Error cleaning up test city:', error);
      }
    }

    // Clean up the created state
    if (stateId) {
      try {
        await deleteState({ id: stateId });
      } catch (error) {
        console.log('Error cleaning up test state:', error);
      }
    }

    // Clean up the created country
    if (countryId) {
      try {
        await deleteCountry({ id: countryId });
      } catch (error) {
        console.log('Error cleaning up test country:', error);
      }
    }
  });

  describe('success scenarios', () => {
    test('should create a new city', async () => {
      // Create a new city
      const response = await createCity(testCity);

      // Store the ID for later cleanup
      createdCityId = response.id;

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(testCity.name);
      expect(response.slug).toBe(testCity.slug);
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

    test('should retrieve paginated cities', async () => {
      const result = await listCitiesPaginated({ page: 1, pageSize: 10 });

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

      // We should at least find our test city
      expect(result.data.some((city) => city.id === createdCityId)).toBe(true);

      // Pagination values should make sense
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.pageSize).toBe(10);
      expect(result.pagination.totalCount).toBeGreaterThanOrEqual(1);
    });

    test('pagination should respect pageSize parameter', async () => {
      // Request with a small page size
      const result = await listCitiesPaginated({ page: 1, pageSize: 1 });

      expect(result.data.length).toBeLessThanOrEqual(1);
      expect(result.pagination.pageSize).toBe(1);
    });

    test('should update a city name', async () => {
      const updatedName = 'Updated Test City';
      const response = await updateCity({
        id: createdCityId,
        name: updatedName,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdCityId);
      expect(response.name).toBe(updatedName);
      // Other fields should remain unchanged
      expect(response.slug).toBe(testCity.slug);
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
      // Longitude should remain unchanged
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
      // Create a city specifically for deletion test
      const cityToDelete = await createCity({
        name: 'City To Delete',
        stateId: stateId,
        slug: 'city-to-delete',
        timezone: 'America/Mexico_City',
        latitude: 19.4326,
        longitude: -99.1332,
      });

      // Delete should not throw an error
      await expect(deleteCity({ id: cityToDelete.id })).resolves.not.toThrow();

      // Attempt to get should throw a not found error
      await expect(getCity({ id: cityToDelete.id })).rejects.toThrow();
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors', async () => {
      await expect(getCity({ id: 9999 })).rejects.toThrow();
    });

    test('should handle duplicate errors', async () => {
      // Try to create city with same slug
      await expect(
        createCity({
          name: 'Duplicate City',
          stateId: testCity.stateId,
          slug: testCity.slug, // Use same slug as existing city
          timezone: 'America/Mexico_City',
          latitude: 19.4326,
          longitude: -99.1332,
        }),
      ).rejects.toThrow();
    });

    test('should handle invalid state ID', async () => {
      // Try to create a city with a non-existent state ID
      await expect(
        createCity({
          name: 'Invalid State City',
          stateId: 9999, // Non-existent state ID
          slug: 'invalid-state-city',
          timezone: 'America/Mexico_City',
          latitude: 19.4326,
          longitude: -99.1332,
        }),
      ).rejects.toThrow();
    });

    test('should handle missing latitude', async () => {
      // Create a payload with latitude intentionally missing
      const invalidPayload = {
        name: 'Missing Latitude City',
        stateId: stateId,
        slug: 'missing-latitude-city',
        timezone: 'America/Mexico_City',
        longitude: -99.1332,
        // latitude field intentionally omitted
      };

      // Assert that the API rejects the request
      // @ts-expect-error - Intentionally missing required field
      await expect(createCity(invalidPayload)).rejects.toThrow();
    });

    test('should handle missing longitude', async () => {
      // Create a payload with longitude intentionally missing
      const invalidPayload = {
        name: 'Missing Longitude City',
        stateId: stateId,
        slug: 'missing-longitude-city',
        timezone: 'America/Mexico_City',
        latitude: 19.4326,
        // longitude field intentionally omitted
      };

      // Assert that the API rejects the request
      // @ts-expect-error - Intentionally missing required field
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
      // Create test cities with different names for verification of default sorting
      const cityA = await createCity({
        name: 'AAA Test City',
        stateId: stateId,
        slug: 'aaa-test-city',
        timezone: 'America/Mexico_City',
        latitude: 19.4326,
        longitude: -99.1332,
      });

      const cityZ = await createCity({
        name: 'ZZZ Test City',
        stateId: stateId,
        slug: 'zzz-test-city',
        timezone: 'America/Mexico_City',
        latitude: 19.4326,
        longitude: -99.1332,
      });

      try {
        // Get cities with large enough page size to include test cities
        const response = await listCitiesPaginated({
          pageSize: 50,
        });

        // Find the indices of our test cities
        const indexA = response.data.findIndex((c) => c.id === cityA.id);
        const indexZ = response.data.findIndex((c) => c.id === cityZ.id);

        // Verify that cityA (AAA) comes before cityZ (ZZZ) in the results
        if (indexA !== -1 && indexZ !== -1) {
          expect(indexA).toBeLessThan(indexZ);
        }
      } finally {
        // Clean up test cities
        await deleteCity({ id: cityA.id });
        await deleteCity({ id: cityZ.id });
      }
    });
  });
});
