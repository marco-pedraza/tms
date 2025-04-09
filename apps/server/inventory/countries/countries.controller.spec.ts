import { expect, describe, test, afterAll } from 'vitest';
import {
  createCountry,
  getCountry,
  updateCountry,
  deleteCountry,
  listCountries,
  listCountriesPaginated,
} from './countries.controller';
import type { Countries } from './countries.types';

describe('Countries Controller', () => {
  // Test data and setup
  const testCountry = {
    name: 'Test Country',
    code: 'TC',
    active: true,
  };

  // Variable to store created IDs for cleanup
  let createdCountryId: number;

  afterAll(async () => {
    if (createdCountryId) {
      try {
        await deleteCountry({ id: createdCountryId });
      } catch (error) {
        console.log('Error cleaning up test country:', error);
      }
    }
  });

  describe('success scenarios', () => {
    test('should create a new country', async () => {
      // Create a new country
      const response = await createCountry(testCountry);

      // Store the ID for later cleanup
      createdCountryId = response.id;

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(testCountry.name);
      expect(response.code).toBe(testCountry.code);
      expect(response.active).toBe(testCountry.active);
      expect(response.createdAt).toBeDefined();
    });

    test('should retrieve a country by ID', async () => {
      const response = await getCountry({ id: createdCountryId });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdCountryId);
      expect(response.name).toBe(testCountry.name);
    });

    test('should update a country', async () => {
      const updatedName = 'Updated Test Country';
      const response = await updateCountry({
        id: createdCountryId,
        name: updatedName,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdCountryId);
      expect(response.name).toBe(updatedName);
    });

    test('should delete a country', async () => {
      // Create a country specifically for deletion test
      const countryToDelete = await createCountry({
        name: 'Country To Delete',
        code: 'CTD',
      });

      // Delete should not throw an error
      await expect(
        deleteCountry({ id: countryToDelete.id }),
      ).resolves.not.toThrow();

      // Attempt to get should throw a not found error
      await expect(getCountry({ id: countryToDelete.id })).rejects.toThrow();
    });
  });

  describe('error scenarios', () => {
    // NOTE: We are not testing the validation errors because it's handled by Encore rust runtime and they are not thrown in the controller

    test('should handle not found errors', async () => {
      await expect(getCountry({ id: 9999 })).rejects.toThrow();
    });

    test('should handle duplicate errors', async () => {
      // Try to create country with same name/code as existing one
      await expect(
        createCountry({
          name: testCountry.name,
          code: testCountry.code,
        }),
      ).rejects.toThrow();
    });
  });

  describe('pagination', () => {
    test('should return paginated countries with default parameters', async () => {
      const response = await listCountriesPaginated({});

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
      const response = await listCountriesPaginated({
        page: 1,
        pageSize: 5,
      });

      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
      expect(response.data.length).toBeLessThanOrEqual(5);
    });

    test('should default sort by name in ascending order', async () => {
      // Create test countries with different names for verification of default sorting
      const countryA = await createCountry({
        name: 'AAA Test Country',
        code: 'AAA',
      });
      const countryZ = await createCountry({
        name: 'ZZZ Test Country',
        code: 'ZZZ',
      });

      try {
        // Get countries with large enough page size to include test countries
        const response = await listCountriesPaginated({
          pageSize: 50,
        });

        // Find the indices of our test countries
        const indexA = response.data.findIndex((c) => c.id === countryA.id);
        const indexZ = response.data.findIndex((c) => c.id === countryZ.id);

        // Verify that countryA (AAA) comes before countryZ (ZZZ) in the results
        // This assumes they both appear in the results (which they should with pageSize: 50)
        if (indexA !== -1 && indexZ !== -1) {
          expect(indexA).toBeLessThan(indexZ);
        }
      } finally {
        // Clean up test countries
        await deleteCountry({ id: countryA.id });
        await deleteCountry({ id: countryZ.id });
      }
    });

    test('should return non-paginated list for dropdowns', async () => {
      const response = (await listCountries()) as Countries;

      expect(response.countries).toBeDefined();
      expect(Array.isArray(response.countries)).toBe(true);
      expect(response.countries.length).toBeGreaterThan(0);
    });
  });
});
