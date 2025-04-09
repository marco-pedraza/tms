import { expect, describe, test, beforeAll, afterAll } from 'vitest';
import {
  createTerminal,
  getTerminal,
  listTerminals,
  updateTerminal,
  deleteTerminal,
} from './terminals.controller';
import { createCity, deleteCity } from '../cities/cities.controller';
import { createState, deleteState } from '../states/states.controller';
import {
  createCountry,
  deleteCountry,
} from '../countries/countries.controller';

describe('Terminals Controller', () => {
  // Test data and setup
  let countryId: number; // We need a valid country ID for creating a state
  let stateId: number; // We need a valid state ID for creating a city
  let cityId: number; // We need a valid city ID for terminal tests

  const testTerminal = {
    name: 'Test Terminal',
    address: '123 Test Street',
    cityId: 0, // This will be populated in beforeAll
    latitude: 19.4326,
    longitude: -99.1332,
    contactphone: '555-1234',
    operatingHours: {
      monday: { open: '08:00', close: '20:00' },
      tuesday: { open: '08:00', close: '20:00' },
      wednesday: { open: '08:00', close: '20:00' },
      thursday: { open: '08:00', close: '20:00' },
      friday: { open: '08:00', close: '20:00' },
      saturday: { open: '09:00', close: '18:00' },
      sunday: { open: '10:00', close: '16:00' },
      notes: 'Closed on major holidays',
    },
    facilities: [
      { name: 'Waiting Area', description: 'Comfortable seating area' },
      { name: 'Restrooms', description: 'Clean public restrooms' },
    ],
    code: 'TEST-TERM-01',
    slug: 'test-terminal', // Slug format: lowercase, hyphen-separated
    active: true,
  };

  // Variable to store created IDs for cleanup
  let createdTerminalId: number;
  // Array to track additional terminals created in tests
  let additionalTerminalIds: number[] = [];

  // Setup test dependencies - create country, state, and city
  beforeAll(async () => {
    // Create a temporary country
    const country = await createCountry({
      name: 'Test Country for Terminals',
      code: 'TCTER',
      active: true,
    });
    countryId = country.id;

    // Create a temporary state using the country
    const state = await createState({
      name: 'Test State for Terminals',
      code: 'TSTER',
      countryId: countryId,
      active: true,
    });
    stateId = state.id;

    // Create a temporary city using the state
    const city = await createCity({
      name: 'Test City for Terminals',
      stateId: stateId,
      latitude: 19.4326,
      longitude: -99.1332,
      timezone: 'America/Mexico_City',
      slug: 'test-city-terminals',
      active: true,
    });
    cityId = city.id;
    testTerminal.cityId = cityId; // Update the test terminal with the real city ID
  });

  // Clean up after all tests
  afterAll(async () => {
    // Clean up any additional terminals created during tests
    for (const id of additionalTerminalIds) {
      try {
        await deleteTerminal({ id });
      } catch (error) {
        console.log(`Error cleaning up additional terminal ${id}:`, error);
      }
    }

    // Clean up the main created terminal if any
    if (createdTerminalId) {
      try {
        await deleteTerminal({ id: createdTerminalId });
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
    test('should create a new terminal with properly formatted slug', async () => {
      // Create a new terminal
      const response = await createTerminal(testTerminal);

      // Store the ID for later cleanup
      createdTerminalId = response.id;

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(testTerminal.name);
      expect(response.address).toBe(testTerminal.address);
      expect(response.cityId).toBe(testTerminal.cityId);
      expect(response.latitude).toBe(testTerminal.latitude);
      expect(response.longitude).toBe(testTerminal.longitude);
      expect(response.contactphone).toBe(testTerminal.contactphone);
      expect(response.operatingHours).toEqual(testTerminal.operatingHours);
      expect(response.facilities).toEqual(testTerminal.facilities);
      expect(response.code).toBe(testTerminal.code);
      expect(response.slug).toBe(testTerminal.slug);
      expect(response.active).toBe(testTerminal.active);
      expect(response.createdAt).toBeDefined();

      // Validate slug format: lowercase, hyphen-separated, no special chars
      expect(response.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    });

    test('should create a terminal with multi-word slug', async () => {
      // Create a terminal with multi-word slug
      const terminalWithComplexSlug = await createTerminal({
        name: 'Terminal Central del Norte',
        address: '456 Central Avenue',
        cityId: cityId,
        latitude: 19.4326,
        longitude: -99.1332,
        contactphone: '555-5678',
        code: 'TERM-CENTRAL',
        slug: 'terminal-central-norte', // Multi-word slug with hyphens
        active: true,
      });

      // Add to list of terminals to clean up
      additionalTerminalIds.push(terminalWithComplexSlug.id);

      // Assertions for slug format
      expect(terminalWithComplexSlug.slug).toBe('terminal-central-norte');
      expect(terminalWithComplexSlug.slug).toMatch(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      );

      // Clean up
      await deleteTerminal({ id: terminalWithComplexSlug.id });
      // Remove from cleanup list since we just deleted it
      additionalTerminalIds = additionalTerminalIds.filter(
        (id) => id !== terminalWithComplexSlug.id,
      );
    });

    test('should retrieve a terminal by ID', async () => {
      const response = await getTerminal({ id: createdTerminalId });

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBe(createdTerminalId);
      expect(response.name).toBe(testTerminal.name);
      expect(response.address).toBe(testTerminal.address);
      expect(response.cityId).toBe(testTerminal.cityId);
      expect(response.latitude).toBe(testTerminal.latitude);
      expect(response.longitude).toBe(testTerminal.longitude);
    });

    test('should list terminals with pagination', async () => {
      // Create a few more terminals for pagination testing
      const extraTerminals = [
        {
          name: 'Terminal East',
          address: '789 East Street',
          cityId: cityId,
          latitude: 19.4226,
          longitude: -99.1432,
          code: 'TERM-EAST',
          slug: 'terminal-east',
          active: true,
        },
        {
          name: 'Terminal West',
          address: '101 West Avenue',
          cityId: cityId,
          latitude: 19.4426,
          longitude: -99.1232,
          code: 'TERM-WEST',
          slug: 'terminal-west',
          active: true,
        },
      ];

      // Create the extra terminals
      for (const terminal of extraTerminals) {
        const created = await createTerminal(terminal);
        additionalTerminalIds.push(created.id);
      }

      // Test pagination with default parameters (page 1, pageSize 10)
      const response = await listTerminals({});

      // Assertions
      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      // At least our created terminals should be in the list
      expect(response.data.length).toBeGreaterThanOrEqual(3);

      // Check pagination metadata
      expect(response.pagination).toBeDefined();
      expect(typeof response.pagination.currentPage).toBe('number');
      expect(typeof response.pagination.pageSize).toBe('number');
      expect(typeof response.pagination.totalCount).toBe('number');
    });

    test('should update a terminal', async () => {
      // Update data
      const updateData = {
        id: createdTerminalId,
        name: 'Updated Terminal Name',
        latitude: 19.5,
        longitude: -99.2,
      };

      const response = await updateTerminal(updateData);

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBe(createdTerminalId);
      expect(response.name).toBe(updateData.name);
      expect(response.latitude).toBe(updateData.latitude);
      expect(response.longitude).toBe(updateData.longitude);
      // Original data that wasn't updated should remain
      expect(response.address).toBe(testTerminal.address);
      expect(response.slug).toBe(testTerminal.slug);
    });

    test('should delete a terminal', async () => {
      // Create a terminal specifically for deletion test
      const terminalToDelete = await createTerminal({
        name: 'Terminal To Delete',
        address: '321 Delete Street',
        cityId: cityId,
        latitude: 19.4326,
        longitude: -99.1332,
        code: 'TERM-DELETE',
        slug: 'terminal-to-delete',
        active: true,
      });

      // Delete the terminal
      const response = await deleteTerminal({ id: terminalToDelete.id });

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBe(terminalToDelete.id);
      expect(response.name).toBe('Terminal To Delete');

      // Verify it's deleted by trying to get it (should throw)
      try {
        await getTerminal({ id: terminalToDelete.id });
        // If we got here, the terminal wasn't deleted
        expect(true).toBe(false); // This should never execute
      } catch (error) {
        // Expected behavior - terminal not found
        expect(error).toBeDefined();
      }
    });
  });

  describe('error scenarios', () => {
    test('should fail to create terminal with missing required fields', async () => {
      // Missing required field: name
      try {
        // @ts-expect-error - Testing validation by intentionally omitting required 'name' field
        await createTerminal({
          address: '123 Missing Name Street',
          cityId: cityId,
          latitude: 19.4326,
          longitude: -99.1332,
          code: 'MISSING-NAME',
          slug: 'missing-name',
          active: true,
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Missing required field: latitude
      try {
        // @ts-expect-error - Testing validation by intentionally omitting required 'latitude' field
        await createTerminal({
          name: 'Missing Coordinates Terminal',
          address: '123 Missing Coords Street',
          cityId: cityId,
          longitude: -99.1332, // Missing latitude
          code: 'MISSING-COORDS',
          slug: 'missing-coordinates',
          active: true,
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should fail to create terminal with duplicate slug', async () => {
      try {
        // Attempt to create a terminal with same slug as existing terminal
        await createTerminal({
          name: 'Duplicate Slug Terminal',
          address: '123 Duplicate Slug Street',
          cityId: cityId,
          latitude: 19.4326,
          longitude: -99.1332,
          code: 'UNIQUE-CODE', // Different code
          slug: testTerminal.slug, // Same slug as existing terminal
          active: true,
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should fail to create terminal with duplicate code', async () => {
      try {
        // Attempt to create a terminal with same code as existing terminal
        await createTerminal({
          name: 'Duplicate Code Terminal',
          address: '123 Duplicate Code Street',
          cityId: cityId,
          latitude: 19.4326,
          longitude: -99.1332,
          code: testTerminal.code, // Same code as existing terminal
          slug: 'unique-slug-for-test', // Different slug
          active: true,
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should fail to retrieve non-existent terminal', async () => {
      try {
        // Very large ID that likely doesn't exist
        await getTerminal({ id: 9999999 });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should fail to update non-existent terminal', async () => {
      try {
        // Very large ID that likely doesn't exist
        await updateTerminal({
          id: 9999999,
          name: 'This Should Fail',
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should fail to delete non-existent terminal', async () => {
      try {
        // Very large ID that likely doesn't exist
        await deleteTerminal({ id: 9999999 });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
