import { expect, describe, test, afterAll } from 'vitest';
import {
  createCountry,
  getCountry,
  listCountries,
  updateCountry,
  deleteCountry,
} from './countries.controller';

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

    test('should list all countries', async () => {
      const response = await listCountries();

      expect(response.countries).toBeDefined();
      expect(Array.isArray(response.countries)).toBe(true);
      expect(response.countries.length).toBeGreaterThan(0);
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
});
