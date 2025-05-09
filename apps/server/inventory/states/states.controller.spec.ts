import { expect, describe, test, beforeAll, afterAll } from 'vitest';
import {
  createState,
  getState,
  updateState,
  deleteState,
  listStates,
  listStatesPaginated,
  searchStates,
  searchStatesPaginated,
} from './states.controller';
import {
  createCountry,
  deleteCountry,
} from '../countries/countries.controller';
import type { State } from './states.types';

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

  beforeAll(async () => {
    // Create a temporary country to use for the state tests
    const country = await createCountry({
      name: 'Test Country for States',
      code: 'TCS',
      active: true,
    });
    countryId = country.id;
    testState.countryId = countryId;
  });

  afterAll(async () => {
    if (createdStateId) {
      try {
        await deleteState({ id: createdStateId });
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
    test('should create a new state', async () => {
      const response = await createState(testState);
      createdStateId = response.id;
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

    test('should update a state', async () => {
      const updatedName = 'Updated Test State';
      const response = await updateState({
        id: createdStateId,
        name: updatedName,
      });
      expect(response).toBeDefined();
      expect(response.id).toBe(createdStateId);
      expect(response.name).toBe(updatedName);
      expect(response.code).toBe(testState.code);
      expect(response.countryId).toBe(testState.countryId);
    });

    test('should delete a state', async () => {
      const stateToDelete = await createState({
        name: 'State To Delete',
        code: 'STD',
        countryId: countryId,
      });
      await expect(
        deleteState({ id: stateToDelete.id }),
      ).resolves.not.toThrow();
      await expect(getState({ id: stateToDelete.id })).rejects.toThrow();
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors', async () => {
      await expect(getState({ id: 9999 })).rejects.toThrow();
    });

    test('should handle duplicate errors', async () => {
      await expect(
        createState({
          name: testState.name,
          code: testState.code,
          countryId: testState.countryId,
        }),
      ).rejects.toThrow();
    });

    test('should handle invalid country ID', async () => {
      await expect(
        createState({
          name: 'Invalid Country State',
          code: 'ICS',
          countryId: 9999,
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
        const response = await listStatesPaginated({
          pageSize: 50,
        });
        const indexA = response.data.findIndex((s) => s.id === stateA.id);
        const indexZ = response.data.findIndex((s) => s.id === stateZ.id);
        if (indexA !== -1 && indexZ !== -1) {
          expect(indexA).toBeLessThan(indexZ);
        }
      } finally {
        await deleteState({ id: stateA.id });
        await deleteState({ id: stateZ.id });
      }
    });

    test('should return non-paginated list for dropdowns', async () => {
      const response = await listStates({});
      expect(response.states).toBeDefined();
      expect(Array.isArray(response.states)).toBe(true);
      expect(response.states.length).toBeGreaterThan(0);
      expect(response).not.toHaveProperty('pagination');
    });
  });

  describe('search functionality', () => {
    test('should search states', async () => {
      const searchableState = await createState({
        name: 'Searchable Test State',
        code: 'STS',
        countryId: countryId,
        active: true,
      });
      try {
        const response = await searchStates({ term: 'Searchable' });
        expect(response.states).toBeDefined();
        expect(Array.isArray(response.states)).toBe(true);
        expect(response.states.some((s) => s.id === searchableState.id)).toBe(
          true,
        );
      } finally {
        await deleteState({ id: searchableState.id });
      }
    });

    test('should search states with pagination', async () => {
      const response = await searchStatesPaginated({
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
    const testStates: State[] = [];

    beforeAll(async () => {
      const states = [
        { name: 'Alpha State', code: 'AS', countryId, active: true },
        { name: 'Beta State', code: 'BS', countryId, active: false },
        { name: 'Gamma State', code: 'GS', countryId, active: true },
      ];
      for (const state of states) {
        const created = await createState(state);
        testStates.push(created);
      }
    });

    afterAll(async () => {
      for (const state of testStates) {
        try {
          await deleteState({ id: state.id });
        } catch (error) {
          console.log(`Error cleaning up test state ${state.id}:`, error);
        }
      }
    });

    test('should order states by name descending', async () => {
      const response = await listStates({
        orderBy: [{ field: 'name', direction: 'desc' }],
      });
      const names = response.states.map((s) => s.name);
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] >= names[i + 1]).toBe(true);
      }
    });

    test('should filter states by active status', async () => {
      const response = await listStates({
        filters: { active: true },
      });
      expect(response.states.every((s) => s.active === true)).toBe(true);
      const activeTestStateIds = testStates
        .filter((s) => s.active)
        .map((s) => s.id);
      for (const id of activeTestStateIds) {
        expect(response.states.some((s) => s.id === id)).toBe(true);
      }
    });

    test('should combine ordering and filtering in paginated results', async () => {
      const response = await listStatesPaginated({
        filters: { active: true },
        orderBy: [{ field: 'name', direction: 'asc' }],
        page: 1,
        pageSize: 10,
      });
      expect(response.data.every((s) => s.active === true)).toBe(true);
      const names = response.data.map((s) => s.name);
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] <= names[i + 1]).toBe(true);
      }
      expect(response.pagination).toBeDefined();
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(10);
    });

    test('should allow multi-field ordering', async () => {
      const sameActiveStatusStates = [
        { name: 'Same Status A', code: 'SSA', countryId, active: true },
        { name: 'Same Status B', code: 'SSB', countryId, active: true },
      ];
      const createdStates: State[] = [];
      try {
        for (const state of sameActiveStatusStates) {
          const created = await createState(state);
          createdStates.push(created);
        }
        const response = await listStates({
          orderBy: [
            { field: 'active', direction: 'desc' },
            { field: 'name', direction: 'asc' },
          ],
        });
        const activeStates = response.states.filter((s) => s.active === true);
        const activeNames = activeStates.map((s) => s.name);
        for (let i = 0; i < activeNames.length - 1; i++) {
          if (activeStates[i].active === activeStates[i + 1].active) {
            expect(activeNames[i] <= activeNames[i + 1]).toBe(true);
          }
        }
      } finally {
        for (const state of createdStates) {
          await deleteState({ id: state.id });
        }
      }
    });
  });
});
