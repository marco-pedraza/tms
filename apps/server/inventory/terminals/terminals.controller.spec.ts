import { expect, describe, test, beforeAll, afterAll } from 'vitest';
import {
  createTerminal,
  getTerminal,
  updateTerminal,
  deleteTerminal,
  listTerminalsPaginated,
  listTerminals,
  searchTerminals,
  searchTerminalsPaginated,
} from './terminals.controller';
import { createCity, deleteCity } from '../cities/cities.controller';
import { createState, deleteState } from '../states/states.controller';
import {
  createCountry,
  deleteCountry,
} from '../countries/countries.controller';
import { createSlug } from '../../shared/utils';
import {
  Facility,
  OperatingHours,
  Terminal,
  TerminalWithCity,
} from './terminals.types';

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
      monday: [{ open: '08:00', close: '20:00' }],
      tuesday: [{ open: '08:00', close: '20:00' }],
      wednesday: [{ open: '08:00', close: '20:00' }],
      thursday: [{ open: '08:00', close: '20:00' }],
      friday: [{ open: '08:00', close: '20:00' }],
      saturday: [{ open: '09:00', close: '18:00' }],
      sunday: [{ open: '10:00', close: '16:00' }],
    },
    facilities: [
      { name: 'Waiting Area', description: 'Comfortable seating area' },
      { name: 'Restrooms', description: 'Clean public restrooms' },
    ],
    code: 'TEST-TERM-01',
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
      active: true,
    });
    cityId = city.id;
    testTerminal.cityId = cityId; // Update the test terminal with the real city ID
  });

  // Cleanup after all tests
  afterAll(async () => {
    // Clean up any additional terminals created during tests
    for (const id of additionalTerminalIds) {
      try {
        await deleteTerminal({ id });
        // eslint-disable-next-line
      } catch (error: any) {
        // Opción 2: Ignorar error si ya no existe
        if (
          error?.name === 'NotFoundError' ||
          (typeof error?.message === 'string' &&
            error.message.toLowerCase().includes('not found'))
        ) {
          continue;
        }
        console.error(`Error deleting additional terminal ${id}:`, error);
      }
    }

    // Clean up the main test terminal if it was created
    if (createdTerminalId) {
      try {
        await deleteTerminal({ id: createdTerminalId });
      } catch (error) {
        console.error(
          `Error deleting main test terminal ${createdTerminalId}:`,
          error,
        );
      }
    }

    // Clean up city, state, country
    try {
      await deleteCity({ id: cityId });
      await deleteState({ id: stateId });
      await deleteCountry({ id: countryId });
    } catch (error) {
      console.error('Error in cleanup:', error);
    }
  });

  describe('success scenarios', () => {
    test('should create a new terminal with auto-generated slug with t prefix', async () => {
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
      expect(response.active).toBe(testTerminal.active);
      expect(response.createdAt).toBeDefined();

      // Validate slug was generated correctly from the name with t prefix
      const expectedSlug = createSlug(testTerminal.name, 't');
      expect(response.slug).toBe(expectedSlug);

      // Validate slug format: t-prefixed, lowercase, hyphen-separated, no special chars
      expect(response.slug).toMatch(/^t-[a-z0-9]+(?:-[a-z0-9]+)*$/);
    });

    test('should create a terminal with facilities', async () => {
      // Create a terminal with facilities
      const terminalWithFacilities = await createTerminal({
        name: 'Terminal with Facilities',
        address: '456 Facility Street',
        cityId: cityId,
        latitude: 19.4326,
        longitude: -99.1332,
        code: 'TERM-FAC',
        active: true,
        facilities: [
          {
            name: 'WiFi',
            description: 'Free WiFi for passengers',
            icon: 'wifi',
          },
          {
            name: 'Food Court',
            description: 'Various food options',
            icon: 'food',
          },
        ],
      });

      // Keep track for cleanup
      additionalTerminalIds.push(terminalWithFacilities.id);

      // Assertions for facilities
      expect(terminalWithFacilities.facilities).toBeDefined();
      const facilities = terminalWithFacilities.facilities as Facility[];
      expect(facilities).toHaveLength(2);
      expect(facilities[0].name).toBe('WiFi');
      expect(facilities[1].name).toBe('Food Court');

      // Verify slug has t prefix
      expect(terminalWithFacilities.slug).toMatch(/^t-/);
    });

    test('should create a terminal with multiple operating hours in a day', async () => {
      // Create a terminal with multiple operating hours per day
      const terminalWithMultipleHours = await createTerminal({
        name: 'Terminal with Multiple Hours',
        address: '789 Hours Street',
        cityId: cityId,
        latitude: 19.4326,
        longitude: -99.1332,
        code: 'TERM-HOURS',
        active: true,
        operatingHours: {
          monday: [
            { open: '08:00', close: '12:00' },
            { open: '13:00', close: '20:00' },
          ],
          tuesday: [{ open: '08:00', close: '20:00' }],
          wednesday: [{ open: '08:00', close: '20:00' }],
          thursday: [{ open: '08:00', close: '20:00' }],
          friday: [{ open: '08:00', close: '20:00' }],
          saturday: [{ open: '09:00', close: '18:00' }],
          sunday: [{ open: '10:00', close: '16:00' }],
        },
      });

      // Keep track for cleanup
      additionalTerminalIds.push(terminalWithMultipleHours.id);

      // Assertions for multiple operating hours
      expect(terminalWithMultipleHours.operatingHours).toBeDefined();
      const hours = terminalWithMultipleHours.operatingHours as OperatingHours;
      expect(hours.monday).toBeDefined();
      expect(hours.monday).toHaveLength(2);
      expect(hours.monday?.[0].open).toBe('08:00');
      expect(hours.monday?.[0].close).toBe('12:00');
      expect(hours.monday?.[1].open).toBe('13:00');
      expect(hours.monday?.[1].close).toBe('20:00');

      // Verify slug has t prefix
      expect(terminalWithMultipleHours.slug).toMatch(/^t-/);

      // Clean up
      await deleteTerminal({ id: terminalWithMultipleHours.id });

      // Remove from cleanup list since we just deleted it
      additionalTerminalIds = additionalTerminalIds.filter(
        (id) => id !== terminalWithMultipleHours.id,
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

      // Verify slug has t prefix
      expect(response.slug).toMatch(/^t-/);
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
          active: true,
        },
        {
          name: 'Terminal West',
          address: '101 West Avenue',
          cityId: cityId,
          latitude: 19.4426,
          longitude: -99.1232,
          code: 'TERM-WEST',
          active: true,
        },
      ];

      // Create the extra terminals
      for (const terminal of extraTerminals) {
        const created = await createTerminal(terminal);
        additionalTerminalIds.push(created.id);

        // Verify each created terminal has t-prefixed slug
        expect(created.slug).toMatch(/^t-/);
      }

      // Test pagination with default parameters (page 1, pageSize 10)
      const response = await listTerminalsPaginated({});

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

      // Verify all terminals in response have t-prefixed slugs
      response.data.forEach((terminal: Terminal) => {
        expect(terminal.slug).toMatch(/^t-/);
      });
    });

    test('should update a terminal and regenerate slug when name changes', async () => {
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

      // Slug should be regenerated from the new name with t prefix
      const expectedSlug = createSlug(updateData.name, 't');
      expect(response.slug).toBe(expectedSlug);
      expect(response.slug).toMatch(/^t-/);
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
        active: true,
      });

      // Verify created terminal has t-prefixed slug
      expect(terminalToDelete.slug).toMatch(/^t-/);

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
      try {
        // Missing required fields
        const incompleteData = {
          name: 'Incomplete Terminal',
          // Missing address
          cityId,
          // Missing coordinates
          code: 'INCOMPLETE',
          active: true,
        };

        // @ts-expect-error - Intentionally sending incomplete data
        await createTerminal(incompleteData);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should fail to create terminal with invalid operating hours', async () => {
      try {
        // Invalid time format
        await createTerminal({
          name: 'Terminal With Invalid Hours',
          address: '123 Invalid Hours Street',
          cityId: cityId,
          latitude: 19.4326,
          longitude: -99.1332,
          code: 'TERM-INVALID',
          active: true,
          operatingHours: {
            monday: [{ open: 'invalid', close: '20:00' }],
          },
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

  describe('ordering and filtering', () => {
    const testTerminals: number[] = [];

    beforeAll(async () => {
      const terminals = [
        {
          name: 'Alpha Terminal',
          address: 'Alpha St',
          cityId: cityId,
          latitude: 10,
          longitude: 10,
          code: 'ALPHA-T',
          active: true,
        },
        {
          name: 'Beta Terminal',
          address: 'Beta St',
          cityId: cityId,
          latitude: 20,
          longitude: 20,
          code: 'BETA-T',
          active: false,
        },
        {
          name: 'Gamma Terminal',
          address: 'Gamma St',
          cityId: cityId,
          latitude: 30,
          longitude: 30,
          code: 'GAMMA-T',
          active: true,
        },
      ];

      for (const terminal of terminals) {
        const created = await createTerminal(terminal);
        testTerminals.push(created.id);
        additionalTerminalIds.push(created.id);
      }
    });

    afterAll(async () => {
      for (const id of testTerminals) {
        try {
          await deleteTerminal({ id });
        } catch (error) {
          console.error(`Error deleting test terminal ${id}:`, error);
        }
      }
    });

    test('should order terminals by name descending', async () => {
      const response = await listTerminals({
        orderBy: [{ field: 'name', direction: 'desc' }],
      });

      const names = response.terminals.map((t: Terminal) => t.name);

      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] >= names[i + 1]).toBe(true);
      }
    });

    test('should filter terminals by active status', async () => {
      const response = await listTerminals({
        filters: { active: true },
      });

      expect(response.terminals.every((t: Terminal) => t.active === true)).toBe(
        true,
      );

      const activeTestTerminalIds: number[] = [];

      for (const id of testTerminals) {
        const terminal = await getTerminal({ id });
        if (terminal.active) {
          activeTestTerminalIds.push(id);
        }
      }

      for (const id of activeTestTerminalIds) {
        expect(response.terminals.some((t: Terminal) => t.id === id)).toBe(
          true,
        );
      }
    });

    test('should filter terminals by cityId', async () => {
      const response = await listTerminals({
        filters: { cityId },
      });

      expect(
        response.terminals.every((t: Terminal) => t.cityId === cityId),
      ).toBe(true);
    });

    test('should combine ordering and filtering in paginated results', async () => {
      const response = await listTerminalsPaginated({
        filters: { active: true },
        orderBy: [{ field: 'name', direction: 'asc' }],
        page: 1,
        pageSize: 10,
      });

      expect(response.data.every((t: Terminal) => t.active === true)).toBe(
        true,
      );

      const names = response.data.map((t: Terminal) => t.name);

      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] <= names[i + 1]).toBe(true);
      }

      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(10);
    });

    test('should allow multi-field ordering', async () => {
      const sameActiveStatusTerminals = [
        {
          name: 'Same Status A',
          address: 'SSA St',
          cityId: cityId,
          latitude: 1,
          longitude: 1,
          code: 'SSA-T',
          active: true,
        },
        {
          name: 'Same Status B',
          address: 'SSB St',
          cityId: cityId,
          latitude: 2,
          longitude: 2,
          code: 'SSB-T',
          active: true,
        },
      ];

      const createdTerminals: number[] = [];

      try {
        for (const terminal of sameActiveStatusTerminals) {
          const created = await createTerminal(terminal);
          createdTerminals.push(created.id);
          additionalTerminalIds.push(created.id);
        }

        const response = await listTerminals({
          orderBy: [
            { field: 'active', direction: 'desc' },
            { field: 'name', direction: 'asc' },
          ],
        });

        const activeTerminals = response.terminals.filter(
          (t: Terminal) => t.active === true,
        );

        const activeNames = activeTerminals.map((t: Terminal) => t.name);

        for (let i = 0; i < activeNames.length - 1; i++) {
          if (activeTerminals[i].active === activeTerminals[i + 1].active) {
            expect(activeNames[i] <= activeNames[i + 1]).toBe(true);
          }
        }
      } finally {
        for (const id of createdTerminals) {
          await deleteTerminal({ id });
        }
      }
    });
  });

  describe('search functionality', () => {
    test('should search terminals', async () => {
      const searchableTerminal = await createTerminal({
        name: 'Searchable Test Terminal',
        address: 'Search St',
        cityId: cityId,
        latitude: 50,
        longitude: 50,
        code: 'SEARCH-T',
        active: true,
      });

      additionalTerminalIds.push(searchableTerminal.id);

      try {
        const response = await searchTerminals({ term: 'Searchable' });

        expect(response.terminals).toBeDefined();
        expect(Array.isArray(response.terminals)).toBe(true);
        expect(
          response.terminals.some(
            (t: Terminal) => t.id === searchableTerminal.id,
          ),
        ).toBe(true);
      } finally {
        await deleteTerminal({ id: searchableTerminal.id });
        // Opción 1: Remover del array tras eliminar
        additionalTerminalIds = additionalTerminalIds.filter(
          (id) => id !== searchableTerminal.id,
        );
      }
    });

    test('should search terminals with pagination', async () => {
      const response = await searchTerminalsPaginated({
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

  describe('city association tests', () => {
    test('should retrieve a terminal with its associated city', async () => {
      // Get terminal with city using the getTerminal endpoint
      const terminalWithCity = await getTerminal({ id: createdTerminalId });

      // Verify the terminal data
      expect(terminalWithCity).toBeDefined();
      expect(terminalWithCity.id).toBe(createdTerminalId);

      // Verify the city data is loaded
      expect(terminalWithCity.city).toBeDefined();
      expect(terminalWithCity.city.id).toBe(cityId);
      expect(terminalWithCity.city.name).toBe('Test City for Terminals');
      expect(terminalWithCity.city.stateId).toBe(stateId);
    });

    test('should retrieve terminals with cities using listTerminals', async () => {
      // Get all terminals with city using the listTerminals endpoint
      const response = await listTerminals({});

      // Verify the terminals list
      expect(response).toBeDefined();
      expect(response.terminals).toBeDefined();
      expect(response.terminals.length).toBeGreaterThan(0);

      // Find our test terminal and assert it exists
      const foundTerminal = response.terminals.find(
        (t) => t.id === createdTerminalId,
      );
      expect(foundTerminal).toBeDefined();

      if (foundTerminal) {
        // Verify city data is loaded for the terminal
        // Type assertion since we know this is a TerminalWithCity
        const terminalWithCity = foundTerminal as TerminalWithCity;
        expect(terminalWithCity.city).toBeDefined();
        expect(terminalWithCity.city.id).toBe(cityId);
        expect(terminalWithCity.city.name).toBe('Test City for Terminals');
      }
    });

    test('should retrieve terminals with cities using listTerminalsPaginated', async () => {
      // Get paginated terminals with city data
      const paginatedResponse = await listTerminalsPaginated({
        page: 1,
        pageSize: 10,
      });

      // Verify the pagination data
      expect(paginatedResponse).toBeDefined();
      expect(paginatedResponse.data).toBeDefined();
      expect(paginatedResponse.pagination).toBeDefined();
      expect(paginatedResponse.data.length).toBeGreaterThan(0);

      // Find our test terminal and assert it exists
      const foundTerminal = paginatedResponse.data.find(
        (t) => t.id === createdTerminalId,
      );
      expect(foundTerminal).toBeDefined();

      if (foundTerminal) {
        // Verify city data is loaded for the terminal
        expect(foundTerminal.city).toBeDefined();
        expect(foundTerminal.city.id).toBe(cityId);
        expect(foundTerminal.city.name).toBe('Test City for Terminals');
      }
    });
  });
});
