import { expect, describe, test, beforeAll, afterAll } from 'vitest';
import {
  createState,
  getState,
  listStates,
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

    test('should list all states', async () => {
      const response = await listStates();

      expect(response.states).toBeDefined();
      expect(Array.isArray(response.states)).toBe(true);
      expect(response.states.length).toBeGreaterThan(0);
      // Verify our test state is in the list
      expect(response.states.some((state) => state.id === createdStateId)).toBe(
        true,
      );
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
});
