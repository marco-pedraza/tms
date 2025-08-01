import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { FieldValidationError } from '@repo/base-repo';
import type { Country } from './countries.types';
import { countryRepository } from './countries.repository';
import {
  createCountry,
  deleteCountry,
  getCountry,
  listCountries,
  listCountriesPaginated,
  updateCountry,
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

    describe('field validation errors', () => {
      test('should throw detailed field validation error for duplicate name', async () => {
        // Ensure the test country exists and get fresh data
        const existingCountry = await getCountry({ id: createdCountryId });

        const duplicateNamePayload = {
          name: existingCountry.name, // Same name as existing country
          code: 'UNQ', // Different code
          active: true,
        };

        // Verify that the function rejects
        await expect(createCountry(duplicateNamePayload)).rejects.toThrow();

        // Capture the error to make specific assertions
        let validationError: FieldValidationError | undefined;
        try {
          await createCountry(duplicateNamePayload);
        } catch (error) {
          validationError = error as FieldValidationError;
        }

        // Verify that validation error is thrown (middleware transformation happens at HTTP level)
        expect(validationError).toBeDefined();
        const typedValidationError = validationError as FieldValidationError;
        expect(typedValidationError.name).toBe('FieldValidationError');
        expect(typedValidationError.message).toContain('Validation failed');

        // The error should have fieldErrors array
        expect(typedValidationError.fieldErrors).toBeDefined();
        expect(Array.isArray(typedValidationError.fieldErrors)).toBe(true);
        expect(typedValidationError.fieldErrors).toHaveLength(1);
        expect(typedValidationError.fieldErrors[0].field).toBe('name');
        expect(typedValidationError.fieldErrors[0].code).toBe('DUPLICATE');
        expect(typedValidationError.fieldErrors[0].message).toContain(
          'already exists',
        );
        expect(typedValidationError.fieldErrors[0].value).toBe(
          existingCountry.name,
        );
      });

      test('should throw detailed field validation error for duplicate code', async () => {
        // Ensure the test country exists and get fresh data
        const existingCountry = await getCountry({ id: createdCountryId });

        const duplicateCodePayload = {
          name: 'Different Country Name',
          code: existingCountry.code, // Same code as existing country
          active: true,
        };

        // Verify that the function rejects
        await expect(createCountry(duplicateCodePayload)).rejects.toThrow();

        // Capture the error to make specific assertions
        let validationError: FieldValidationError | undefined;
        try {
          await createCountry(duplicateCodePayload);
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
          existingCountry.code,
        );
      });

      test('should throw field validation error with multiple fields', async () => {
        // Ensure the test country exists and get fresh data
        const existingCountry = await getCountry({ id: createdCountryId });

        const duplicateBothPayload = {
          name: existingCountry.name, // Same name
          code: existingCountry.code, // Same code
          active: true,
        };

        // Verify that the function rejects
        await expect(createCountry(duplicateBothPayload)).rejects.toThrow();

        // Capture the error to make specific assertions
        let validationError: FieldValidationError | undefined;
        try {
          await createCountry(duplicateBothPayload);
        } catch (error) {
          validationError = error as FieldValidationError;
        }

        expect(validationError).toBeDefined();
        const typedValidationError = validationError as FieldValidationError;
        expect(typedValidationError.name).toBe('FieldValidationError');
        expect(typedValidationError.message).toContain('Validation failed');

        expect(typedValidationError.fieldErrors).toBeDefined();
        expect(Array.isArray(typedValidationError.fieldErrors)).toBe(true);
        expect(typedValidationError.fieldErrors).toHaveLength(2);

        // Both fields should have DUPLICATE errors
        const nameError = typedValidationError.fieldErrors.find(
          (e: { field: string }) => e.field === 'name',
        );
        const codeError = typedValidationError.fieldErrors.find(
          (e: { field: string }) => e.field === 'code',
        );

        expect(nameError).toBeDefined();
        expect(codeError).toBeDefined();
        expect(nameError?.code).toBe('DUPLICATE');
      });

      test('should handle update validation errors correctly', async () => {
        // Create another country to test duplicate on update
        const anotherCountry = await createCountry({
          name: 'Another Test Country',
          code: 'ATC',
          active: true,
        });

        // Ensure the test country exists and get fresh data
        const existingCountry = await getCountry({ id: createdCountryId });

        const updatePayload = {
          id: anotherCountry.id,
          name: existingCountry.name, // This should trigger duplicate validation
        };

        try {
          // Verify that the function rejects
          await expect(updateCountry(updatePayload)).rejects.toThrow();

          // Capture the error to make specific assertions
          let validationError: FieldValidationError | undefined;
          try {
            await updateCountry(updatePayload);
          } catch (error) {
            validationError = error as FieldValidationError;
          }

          expect(validationError).toBeDefined();
          const typedValidationError = validationError as FieldValidationError;
          expect(typedValidationError.name).toBe('FieldValidationError');
          expect(typedValidationError.message).toContain('Validation failed');
          expect(typedValidationError.fieldErrors).toBeDefined();
          expect(typedValidationError.fieldErrors[0].field).toBe('name');
          expect(typedValidationError.fieldErrors[0].code).toBe('DUPLICATE');
        } finally {
          // Clean up the additional country
          await deleteCountry({ id: anotherCountry.id });
        }
      });
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
      const response = await listCountries({});

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      // No pagination info should be present
      expect(response).not.toHaveProperty('pagination');
    });
  });

  describe('search functionality', () => {
    test('should search countries using searchTerm in list endpoint', async () => {
      // Create a unique country for search testing
      const searchableCountry = await createCountry({
        name: 'Searchable Test Country',
        code: 'STC',
        active: true,
      });

      try {
        // Search for the country using searchTerm in listCountries
        const response = await listCountries({ searchTerm: 'Searchable' });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.some((c) => c.id === searchableCountry.id)).toBe(
          true,
        );
      } finally {
        // Clean up
        await deleteCountry({ id: searchableCountry.id });
      }
    });

    test('should search countries with pagination using searchTerm', async () => {
      const response = await listCountriesPaginated({
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
      // Create test countries with different active states
      const activeSearchableCountry = await createCountry({
        name: 'Active Searchable Country',
        code: 'ASC',
        active: true,
      });
      const inactiveSearchableCountry = await createCountry({
        name: 'Inactive Searchable Country',
        code: 'ISC',
        active: false,
      });

      try {
        // Search for "Searchable" but only active countries
        const response = await listCountries({
          searchTerm: 'Searchable',
          filters: { active: true },
        });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);

        // Should include the active searchable country
        expect(
          response.data.some((c) => c.id === activeSearchableCountry.id),
        ).toBe(true);

        // Should NOT include the inactive searchable country
        expect(
          response.data.some((c) => c.id === inactiveSearchableCountry.id),
        ).toBe(false);

        // All results should be active
        expect(response.data.every((c) => c.active === true)).toBe(true);
      } finally {
        // Clean up
        await deleteCountry({ id: activeSearchableCountry.id });
        await deleteCountry({ id: inactiveSearchableCountry.id });
      }
    });
  });

  describe('ordering and filtering', () => {
    // Test countries for ordering and filtering tests
    const testCountries: Country[] = [];

    beforeAll(async () => {
      // Create test countries with different properties using unique codes
      const timestamp = Date.now().toString().slice(-6);
      const countries = [
        { name: 'Alpha Country', code: `AC${timestamp}`, active: true },
        { name: 'Beta Country', code: `BC${timestamp}`, active: false },
        { name: 'Gamma Country', code: `GC${timestamp}`, active: true },
      ];

      for (const country of countries) {
        const created = await createCountry(country);
        testCountries.push(created);
      }
    });

    afterAll(async () => {
      // Clean up test countries
      for (const country of testCountries) {
        try {
          await deleteCountry({ id: country.id });
        } catch (error) {
          console.log(`Error cleaning up test country ${country.id}:`, error);
        }
      }
    });

    test('should order countries by name descending', async () => {
      const response = await listCountries({
        orderBy: [{ field: 'name', direction: 'desc' }],
      });

      const names = response.data.map((c) => c.name);
      // Check if names are in descending order
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] >= names[i + 1]).toBe(true);
      }
    });

    test('should filter countries by active status', async () => {
      const response = await listCountries({
        filters: { active: true },
      });

      // All returned countries should be active
      expect(response.data.every((c) => c.active === true)).toBe(true);
      // Should include our active test countries
      const activeTestCountryIds = testCountries
        .filter((c) => c.active)
        .map((c) => c.id);

      for (const id of activeTestCountryIds) {
        expect(response.data.some((c) => c.id === id)).toBe(true);
      }
    });

    test('should combine ordering and filtering in paginated results', async () => {
      const response = await listCountriesPaginated({
        filters: { active: true },
        orderBy: [{ field: 'name', direction: 'asc' }],
        page: 1,
        pageSize: 10,
      });

      // Check filtering
      expect(response.data.every((c) => c.active === true)).toBe(true);

      // Check ordering (ascending)
      const names = response.data.map((c) => c.name);
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] <= names[i + 1]).toBe(true);
      }

      // Check pagination properties
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(10);
    });

    test('should allow multi-field ordering', async () => {
      // Create countries with same active status but different names
      const sameActiveStatusCountries = [
        { name: 'Same Status A', code: 'SSA', active: true },
        { name: 'Same Status B', code: 'SSB', active: true },
      ];

      const createdCountries: Country[] = [];

      try {
        for (const country of sameActiveStatusCountries) {
          const created = await createCountry(country);
          createdCountries.push(created);
        }

        // Order by active status first, then by name
        const response = await listCountries({
          orderBy: [
            { field: 'active', direction: 'desc' },
            { field: 'name', direction: 'asc' },
          ],
        });

        // Get all active countries and verify they're ordered by name
        const activeCountries = response.data.filter((c) => c.active === true);
        const activeNames = activeCountries.map((c) => c.name);

        for (let i = 0; i < activeNames.length - 1; i++) {
          if (activeCountries[i].active === activeCountries[i + 1].active) {
            // If active status is the same, names should be in ascending order
            expect(activeNames[i] <= activeNames[i + 1]).toBe(true);
          }
        }
      } finally {
        // Clean up
        for (const country of createdCountries) {
          await deleteCountry({ id: country.id });
        }
      }
    });
  });

  describe('soft delete functionality', () => {
    test('should restore a soft deleted country', async () => {
      const testCountry = await createCountry({
        name: 'Restore Test Country',
        code: 'RTC',
      });

      try {
        // Soft delete
        await deleteCountry({ id: testCountry.id });
        await expect(getCountry({ id: testCountry.id })).rejects.toThrow();

        // Restore
        await countryRepository.restore(testCountry.id);

        // Verify accessible again
        const found = await getCountry({ id: testCountry.id });
        expect(found.id).toBe(testCountry.id);
      } finally {
        try {
          await countryRepository.forceDelete(testCountry.id);
        } catch {
          // Ignore cleanup errors
        }
      }
    });

    test('should force delete a country permanently', async () => {
      const testCountry = await createCountry({
        name: 'Force Delete Test',
        code: 'FDT',
      });

      // Force delete
      await countryRepository.forceDelete(testCountry.id);

      // Verify completely gone
      await expect(getCountry({ id: testCountry.id })).rejects.toThrow();
      await expect(countryRepository.findOne(testCountry.id)).rejects.toThrow();
    });
  });
});
