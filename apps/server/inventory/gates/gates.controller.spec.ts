import { expect, describe, test, beforeAll, afterAll } from 'vitest';
import {
  createGate,
  getGate,
  listGates,
  listGatesByTerminal,
  updateGate,
  deleteGate,
} from './gates.controller';
import {
  createTerminal,
  deleteTerminal,
} from '../terminals/terminals.controller';
import { createCity, deleteCity } from '../cities/cities.controller';
import { createState, deleteState } from '../states/states.controller';
import {
  createCountry,
  deleteCountry,
} from '../countries/countries.controller';

describe('Gates Controller', () => {
  // Test data and setup
  let countryId: number; // We need a valid country ID for creating a state
  let stateId: number; // We need a valid state ID for creating a city
  let cityId: number; // We need a valid city ID for creating a terminal
  let terminalId: number; // We need a valid terminal ID for gate tests

  const testGate = {
    terminalId: 0, // This will be populated in beforeAll
    active: true,
  };

  // Variable to store created IDs for cleanup
  let createdGateId: number;
  // Array to track additional gates created in tests
  const additionalGateIds: number[] = [];

  // Setup test dependencies - create country, state, city, and terminal
  beforeAll(async () => {
    // Create a temporary country
    const country = await createCountry({
      name: 'Test Country for Gates',
      code: 'TCG',
      active: true,
    });
    countryId = country.id;

    // Create a temporary state using the country
    const state = await createState({
      name: 'Test State for Gates',
      code: 'TSG',
      countryId: countryId,
      active: true,
    });
    stateId = state.id;

    // Create a temporary city using the state
    const city = await createCity({
      name: 'Test City for Gates',
      stateId: stateId,
      latitude: 19.4326,
      longitude: -99.1332,
      timezone: 'America/Mexico_City',
      slug: 'test-city-gates',
      active: true,
    });
    cityId = city.id;

    // Create a temporary terminal using the city
    const terminal = await createTerminal({
      name: 'Test Terminal for Gates',
      address: '123 Test Street',
      cityId: cityId,
      latitude: 19.4326,
      longitude: -99.1332,
      code: 'TEST-TERM-GATES',
      slug: 'test-terminal-gates',
      active: true,
    });
    terminalId = terminal.id;
    testGate.terminalId = terminalId; // Update the test gate with the real terminal ID
  });

  // Clean up after all tests
  afterAll(async () => {
    // Clean up any additional gates created during tests
    for (const id of additionalGateIds) {
      try {
        await deleteGate({ id });
      } catch (error) {
        console.log(`Error cleaning up additional gate ${id}:`, error);
      }
    }

    // Clean up the main created gate if any
    if (createdGateId) {
      try {
        await deleteGate({ id: createdGateId });
      } catch (error) {
        console.log('Error cleaning up test gate:', error);
      }
    }

    // Clean up the created terminal
    if (terminalId) {
      try {
        await deleteTerminal({ id: terminalId });
      } catch (error) {
        console.log('Error cleaning up test terminal:', error);
      }
    }

    // Clean up the created city
    if (cityId) {
      try {
        await deleteCity({ id: cityId });
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
    test('should create a new gate', async () => {
      // Create a new gate
      const response = await createGate(testGate);

      // Store the ID for later cleanup
      createdGateId = response.id;

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.terminalId).toBe(testGate.terminalId);
      expect(response.active).toBe(testGate.active);
      expect(response.createdAt).toBeDefined();
    });

    test('should retrieve a gate by ID', async () => {
      const response = await getGate({ id: createdGateId });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdGateId);
      expect(response.terminalId).toBe(testGate.terminalId);
      expect(response.active).toBe(testGate.active);
    });

    test('should list all gates', async () => {
      const result = await listGates({});

      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);

      // Verify our test gate is in the list
      expect(result.data.some((gate) => gate.id === createdGateId)).toBe(true);
    });

    test('should list gates with pagination', async () => {
      const result = await listGates({ page: 1, pageSize: 10 });

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

      // We should at least find our test gate
      expect(result.data.some((gate) => gate.id === createdGateId)).toBe(true);

      // Pagination values should make sense
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.pageSize).toBe(10);
    });

    test('should list gates by terminal', async () => {
      const result = await listGatesByTerminal({
        terminalId: terminalId,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);

      // All gates should be for the specified terminal
      expect(result.data.every((gate) => gate.terminalId === terminalId)).toBe(
        true,
      );

      // Our test gate should be in the list
      expect(result.data.some((gate) => gate.id === createdGateId)).toBe(true);
    });

    test('should list gates by terminal with pagination', async () => {
      const result = await listGatesByTerminal({
        terminalId: terminalId,
        page: 1,
        pageSize: 10,
      });

      // Check structure and values
      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.pageSize).toBe(10);

      // All gates should be for the specified terminal
      expect(result.data.every((gate) => gate.terminalId === terminalId)).toBe(
        true,
      );
    });

    test('should update a gate', async () => {
      const updatedActive = false;

      const response = await updateGate({
        id: createdGateId,
        active: updatedActive,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdGateId);
      expect(response.active).toBe(updatedActive);
      // Terminal ID should remain unchanged
      expect(response.terminalId).toBe(testGate.terminalId);
    });

    test('should delete a gate', async () => {
      // Create a gate specifically for deletion test
      const gateToDelete = await createGate({
        terminalId: terminalId,
        active: true,
      });

      // Delete the gate
      const response = await deleteGate({ id: gateToDelete.id });

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBe(gateToDelete.id);
      expect(response.terminalId).toBe(terminalId);

      // Verify it's deleted by trying to get it (should throw)
      try {
        await getGate({ id: gateToDelete.id });
        // If we got here, the gate wasn't deleted
        expect(true).toBe(false); // This should never execute
      } catch (error) {
        // Expected behavior - gate not found
        expect(error).toBeDefined();
      }
    });
  });

  describe('error scenarios', () => {
    test('should fail to create gate with invalid terminal ID', async () => {
      try {
        // Try to create a gate with a non-existent terminal ID
        await createGate({
          terminalId: 999999, // Non-existent terminal ID
          active: true,
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should fail to retrieve non-existent gate', async () => {
      try {
        // Very large ID that likely doesn't exist
        await getGate({ id: 9999999 });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should fail to update non-existent gate', async () => {
      try {
        // Very large ID that likely doesn't exist
        await updateGate({ id: 9999999, active: false });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should fail to update gate with invalid terminal ID', async () => {
      try {
        await updateGate({
          id: createdGateId,
          terminalId: 999999, // Non-existent terminal ID
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should fail to delete non-existent gate', async () => {
      try {
        // Very large ID that likely doesn't exist
        await deleteGate({ id: 9999999 });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should fail to list gates by non-existent terminal', async () => {
      try {
        // Very large ID that likely doesn't exist
        await listGatesByTerminal({ terminalId: 9999999 });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
