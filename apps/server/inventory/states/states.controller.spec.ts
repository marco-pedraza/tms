import { expect, describe, test, beforeAll, afterAll } from 'vitest';
import {
  createState,
  getState,
  listStates,
  listStatesPaginated,
  updateState,
  deleteState,
} from './states.controller';
import {
  createCountry,
  deleteCountry,
} from '../countries/countries.controller';

describe('States Controller', () => {
  // Test data and setup
  let countryId: number; // We need a valid country ID for state tests
  const testState = {
    name: 'Test State',
    code: 'TS',
    countryId: 0, // This will be populated in beforeAll
    active: true,
  };

  // Variable to store created IDs for cleanup
  let createdStateId: number;

  // Create a test country before running the state tests
  beforeAll(async () => {
    // Create a temporary country to use for the state tests
    const country = await createCountry({
      name: 'Test Country for States',
      code: 'TCS',
      active: true,
    });

    countryId = country.id;
    testState.countryId = countryId; // Update the test state with the real country ID
  });

  // Clean up after all tests
  afterAll(async () => {
    // Clean up the created state if any
    if (createdStateId) {
      try {
        await deleteState({ id: createdStateId });
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
    test('should create a new state', async () => {
      // Create a new state
      const response = await createState(testState);

      // Store the ID for later cleanup
      createdStateId = response.id;

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(testState.name);
      expect(response.code).toBe(testState.code);
      expect(response.countryId).toBe(testState.countryId);
      expect(response.active).toBe(testState.active);
      expect(response.createdAt).toBeDefined();
    });

    test('should retrieve a state by ID', async () => {
      const response = await getState({ id: createdStateId });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdStateId);
      expect(response.name).toBe(testState.name);
      expect(response.countryId).toBe(testState.countryId);
    });

    test('should retrieve paginated states', async () => {
      const result = await listStatesPaginated({ page: 1, pageSize: 10 });

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

      // We should at least find our test state
      expect(result.data.some((state) => state.id === createdStateId)).toBe(
        true,
      );

      // Pagination values should make sense
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.pageSize).toBe(10);
      expect(result.pagination.totalCount).toBeGreaterThanOrEqual(1);
    });

    test('pagination should respect pageSize parameter', async () => {
      // Request with a small page size
      const result = await listStatesPaginated({ page: 1, pageSize: 1 });

      expect(result.data.length).toBeLessThanOrEqual(1);
      expect(result.pagination.pageSize).toBe(1);
    });

    test('should update a state', async () => {
      const updatedName = 'Updated Test State';
      const response = await updateState({
        id: createdStateId,
        name: updatedName,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdStateId);
      expect(response.name).toBe(updatedName);
      // Other fields should remain unchanged
      expect(response.code).toBe(testState.code);
      expect(response.countryId).toBe(testState.countryId);
    });

    test('should delete a state', async () => {
      // Create a state specifically for deletion test
      const stateToDelete = await createState({
        name: 'State To Delete',
        code: 'STD',
        countryId: countryId,
      });

      // Delete should not throw an error
      await expect(
        deleteState({ id: stateToDelete.id }),
      ).resolves.not.toThrow();

      // Attempt to get should throw a not found error
      await expect(getState({ id: stateToDelete.id })).rejects.toThrow();
    });
  });

  describe('error scenarios', () => {
    // NOTE: We are not testing the validation errors because it's handled by Encore rust runtime and they are not thrown in the controller

    test('should handle not found errors', async () => {
      await expect(getState({ id: 9999 })).rejects.toThrow();
    });

    test('should handle duplicate errors', async () => {
      // Try to create state with same name/code in the same country
      await expect(
        createState({
          name: testState.name,
          code: testState.code,
          countryId: testState.countryId,
        }),
      ).rejects.toThrow();
    });

    test('should handle invalid country ID', async () => {
      // Try to create a state with a non-existent country ID
      await expect(
        createState({
          name: 'Invalid Country State',
          code: 'ICS',
          countryId: 9999, // Non-existent country ID
        }),
      ).rejects.toThrow();
    });
  });

  describe('pagination', () => {
    test('should return paginated states with default parameters', async () => {
      const response = await listStatesPaginated({});

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
      const response = await listStatesPaginated({
        page: 1,
        pageSize: 5,
      });

      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
      expect(response.data.length).toBeLessThanOrEqual(5);
    });

    test('should default sort by name in ascending order', async () => {
      // Create test states with different names for verification of default sorting
      const stateA = await createState({
        name: 'AAA Test State',
        code: 'AAA',
        countryId: countryId,
      });
      const stateZ = await createState({
        name: 'ZZZ Test State',
        code: 'ZZZ',
        countryId: countryId,
      });

      try {
        // Get states with large enough page size to include test states
        const response = await listStatesPaginated({
          pageSize: 50,
        });

        // Find the indices of our test states
        const indexA = response.data.findIndex((s) => s.id === stateA.id);
        const indexZ = response.data.findIndex((s) => s.id === stateZ.id);

        // Verify that stateA (AAA) comes before stateZ (ZZZ) in the results
        // This assumes they both appear in the results (which they should with pageSize: 50)
        if (indexA !== -1 && indexZ !== -1) {
          expect(indexA).toBeLessThan(indexZ);
        }
      } finally {
        // Clean up test states
        await deleteState({ id: stateA.id });
        await deleteState({ id: stateZ.id });
      }
    });

    test('should return non-paginated list for dropdowns', async () => {
      const response = await listStates();

      expect(response.states).toBeDefined();
      expect(Array.isArray(response.states)).toBe(true);
      expect(response.states.length).toBeGreaterThan(0);
      // Verify our test state is in the list
      expect(response.states.some((state) => state.id === createdStateId)).toBe(
        true,
      );
      // No pagination info should be present
      // @ts-expect-error - pagination property check is expected to be undefined
      expect(response.pagination).toBeUndefined();
    });
  });
});
