import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { FieldValidationError } from '@repo/base-repo';
import {
  createCountry,
  deleteCountry,
} from '@/inventory/locations/countries/countries.controller';
import {
  createCleanupHelper,
  createTestSuiteId,
  createUniqueCode,
  createUniqueName,
} from '@/tests/shared/test-utils';
import type { State } from './states.types';
import {
  createState,
  deleteState,
  getState,
  listStates,
  listStatesPaginated,
  updateState,
} from './states.controller';

describe('States Controller', () => {
  // Create unique test suite identifier
  const testSuiteId = createTestSuiteId('states-controller');

  // Setup cleanup helpers
  const countryCleanup = createCleanupHelper(deleteCountry, 'country');
  const stateCleanup = createCleanupHelper(deleteState, 'state');

  // Test data storage
  let testCountryId: number;
  let createdStateId: number;

  beforeAll(async () => {
    // Create a test country with unique name
    const testCountry = await createCountry({
      name: createUniqueName('Test Country for States', testSuiteId),
      code: createUniqueCode('TCS', 3),
      active: true,
    });
    testCountryId = countryCleanup.track(testCountry.id);
  });

  afterAll(async () => {
    // Clean up all tracked entities (states first, then countries)
    await stateCleanup.cleanupAll();
    await countryCleanup.cleanupAll();
  });

  describe('success scenarios', () => {
    test('should create a new state', async () => {
      const testState = {
        name: createUniqueName('Test State', testSuiteId),
        code: createUniqueCode('TS', 3),
        countryId: testCountryId,
        active: true,
      };

      const response = await createState(testState);
      createdStateId = stateCleanup.track(response.id);

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
      expect(response.countryId).toBe(testCountryId);
    });

    test('should update a state', async () => {
      const updatedName = createUniqueName('Updated State', testSuiteId);
      const response = await updateState({
        id: createdStateId,
        name: updatedName,
      });
      expect(response).toBeDefined();
      expect(response.id).toBe(createdStateId);
      expect(response.name).toBe(updatedName);
      expect(response.countryId).toBe(testCountryId);
    });

    test('should delete a state', async () => {
      const stateToDelete = await createState({
        name: createUniqueName('State To Delete', testSuiteId),
        code: createUniqueCode('STD', 3),
        countryId: testCountryId,
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
      const existingState = await getState({ id: createdStateId });

      await expect(
        createState({
          name: existingState.name,
          code: existingState.code,
          countryId: existingState.countryId,
        }),
      ).rejects.toThrow();
    });

    test('should handle invalid country ID', async () => {
      await expect(
        createState({
          name: createUniqueName('Invalid Country State', testSuiteId),
          code: createUniqueCode('ICS', 3),
          countryId: 9999,
        }),
      ).rejects.toThrow();
    });

    describe('field validation errors', () => {
      test('should throw detailed field validation error for duplicate name', async () => {
        const existingState = await getState({ id: createdStateId });

        const duplicateNamePayload = {
          name: existingState.name,
          code: createUniqueCode('UNQ', 3),
          countryId: testCountryId,
          active: true,
        };

        await expect(createState(duplicateNamePayload)).rejects.toThrow();

        let validationError: FieldValidationError | undefined;
        try {
          await createState(duplicateNamePayload);
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
        expect(typedValidationError.fieldErrors[0].field).toBe('name');
        expect(typedValidationError.fieldErrors[0].code).toBe('DUPLICATE');
        expect(typedValidationError.fieldErrors[0].message).toContain(
          'already exists',
        );
        expect(typedValidationError.fieldErrors[0].value).toBe(
          existingState.name,
        );
      });

      test('should throw detailed field validation error for duplicate code', async () => {
        const existingState = await getState({ id: createdStateId });

        const duplicateCodePayload = {
          name: createUniqueName('Different State Name', testSuiteId),
          code: existingState.code,
          countryId: testCountryId,
          active: true,
        };

        await expect(createState(duplicateCodePayload)).rejects.toThrow();

        let validationError: FieldValidationError | undefined;
        try {
          await createState(duplicateCodePayload);
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
          existingState.code,
        );
      });

      test('should throw field validation error with multiple fields', async () => {
        const existingState = await getState({ id: createdStateId });

        const duplicateBothPayload = {
          name: existingState.name,
          code: existingState.code,
          countryId: testCountryId,
          active: true,
        };

        await expect(createState(duplicateBothPayload)).rejects.toThrow();

        let validationError: FieldValidationError | undefined;
        try {
          await createState(duplicateBothPayload);
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

        const nameError = typedValidationError.fieldErrors.find(
          (e: { field: string }) => e.field === 'name',
        );
        const codeError = typedValidationError.fieldErrors.find(
          (e: { field: string }) => e.field === 'code',
        );

        expect(nameError).toBeDefined();
        expect(codeError).toBeDefined();
        expect(nameError?.code).toBe('DUPLICATE');
        expect(codeError?.code).toBe('DUPLICATE');
      });

      test('should handle update validation errors correctly', async () => {
        const anotherState = await createState({
          name: createUniqueName('Another Test State', testSuiteId),
          code: createUniqueCode('ATS', 3),
          countryId: testCountryId,
          active: true,
        });

        const anotherStateId = stateCleanup.track(anotherState.id);
        const existingState = await getState({ id: createdStateId });

        const updatePayload = {
          id: anotherStateId,
          name: existingState.name,
        };

        await expect(updateState(updatePayload)).rejects.toThrow();

        let validationError: FieldValidationError | undefined;
        try {
          await updateState(updatePayload);
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
      });
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
        name: createUniqueName('AAA Test State', testSuiteId),
        code: createUniqueCode('AAA', 3),
        countryId: testCountryId,
      });
      const stateZ = await createState({
        name: createUniqueName('ZZZ Test State', testSuiteId),
        code: createUniqueCode('ZZZ', 3),
        countryId: testCountryId,
      });

      stateCleanup.track(stateA.id);
      stateCleanup.track(stateZ.id);

      const response = await listStatesPaginated({
        pageSize: 50,
      });
      const indexA = response.data.findIndex((s) => s.id === stateA.id);
      const indexZ = response.data.findIndex((s) => s.id === stateZ.id);
      if (indexA !== -1 && indexZ !== -1) {
        expect(indexA).toBeLessThan(indexZ);
      }
    });

    test('should return non-paginated list for dropdowns', async () => {
      const response = await listStates({});
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      expect(response).not.toHaveProperty('pagination');
    });
  });

  describe('search functionality', () => {
    test('should search states using searchTerm in list endpoint', async () => {
      const searchableState = await createState({
        name: createUniqueName('Searchable Test State', testSuiteId),
        code: createUniqueCode('STS', 3),
        countryId: testCountryId,
        active: true,
      });

      stateCleanup.track(searchableState.id);

      const response = await listStates({ searchTerm: 'Searchable' });
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.some((s) => s.id === searchableState.id)).toBe(true);
    });

    test('should search states with pagination using searchTerm', async () => {
      const response = await listStatesPaginated({
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
  });

  describe('ordering and filtering', () => {
    const testStates: State[] = [];

    beforeAll(async () => {
      const stateTemplates = [
        {
          name: createUniqueName('Alpha State', testSuiteId),
          code: createUniqueCode('AS', 3),
          countryId: testCountryId,
          active: true,
        },
        {
          name: createUniqueName('Beta State', testSuiteId),
          code: createUniqueCode('BS', 3),
          countryId: testCountryId,
          active: false,
        },
        {
          name: createUniqueName('Gamma State', testSuiteId),
          code: createUniqueCode('GS', 3),
          countryId: testCountryId,
          active: true,
        },
      ];

      for (const template of stateTemplates) {
        const created = await createState(template);
        testStates.push(created);
        stateCleanup.track(created.id);
      }
    });

    test('should order states by name descending', async () => {
      const response = await listStates({
        orderBy: [{ field: 'name', direction: 'desc' }],
      });
      const names = response.data.map((s) => s.name);
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i] >= names[i + 1]).toBe(true);
      }
    });

    test('should filter states by active status', async () => {
      const response = await listStates({
        filters: { active: true },
      });
      expect(response.data.every((s) => s.active === true)).toBe(true);
      const activeTestStateIds = testStates
        .filter((s) => s.active)
        .map((s) => s.id);
      for (const id of activeTestStateIds) {
        expect(response.data.some((s) => s.id === id)).toBe(true);
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
      const sameStatusStates = [
        {
          name: createUniqueName('Same Status A', testSuiteId),
          code: createUniqueCode('SSA', 3),
          countryId: testCountryId,
          active: true,
        },
        {
          name: createUniqueName('Same Status B', testSuiteId),
          code: createUniqueCode('SSB', 3),
          countryId: testCountryId,
          active: true,
        },
      ];

      const createdStates: State[] = [];
      for (const template of sameStatusStates) {
        const created = await createState(template);
        createdStates.push(created);
        stateCleanup.track(created.id);
      }

      const response = await listStates({
        orderBy: [
          { field: 'active', direction: 'desc' },
          { field: 'name', direction: 'asc' },
        ],
      });

      // Find our test states in the response
      const stateA = response.data.find((s) => s.id === createdStates[0].id);
      const stateB = response.data.find((s) => s.id === createdStates[1].id);

      if (stateA && stateB) {
        const indexA = response.data.indexOf(stateA);
        const indexB = response.data.indexOf(stateB);
        expect(indexA).toBeLessThan(indexB);
      }
    });
  });

  describe('combined search and filtering', () => {
    // Add cleanup helper for combined search and filtering tests
    const combinedSearchCleanup = createCleanupHelper(
      deleteState,
      'combined-search-state',
    );

    afterAll(async () => {
      await combinedSearchCleanup.cleanupAll();
    });

    test('should combine searchTerm with filters in non-paginated results', async () => {
      // Create test states with specific patterns
      const searchableActiveState = await createState({
        name: createUniqueName('SearchFilter Active State', testSuiteId),
        code: createUniqueCode('SFA', 3),
        countryId: testCountryId,
        active: true,
      });
      const searchableInactiveState = await createState({
        name: createUniqueName('SearchFilter Inactive State', testSuiteId),
        code: createUniqueCode('SFI', 3),
        countryId: testCountryId,
        active: false,
      });

      combinedSearchCleanup.track(searchableActiveState.id);
      combinedSearchCleanup.track(searchableInactiveState.id);

      // Search for "SearchFilter" but only active states
      const response = await listStates({
        searchTerm: 'SearchFilter',
        filters: { active: true },
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      // Should include the active state
      expect(response.data.some((s) => s.id === searchableActiveState.id)).toBe(
        true,
      );

      // Should NOT include the inactive state
      expect(
        response.data.some((s) => s.id === searchableInactiveState.id),
      ).toBe(false);

      // All results should be active
      expect(response.data.every((s) => s.active === true)).toBe(true);
    });

    test('should combine searchTerm with filters in paginated results', async () => {
      // Create test states with specific patterns
      const searchableActiveState = await createState({
        name: createUniqueName('PaginatedSearch Active State', testSuiteId),
        code: createUniqueCode('PSA', 3),
        countryId: testCountryId,
        active: true,
      });
      const searchableInactiveState = await createState({
        name: createUniqueName('PaginatedSearch Inactive State', testSuiteId),
        code: createUniqueCode('PSI', 3),
        countryId: testCountryId,
        active: false,
      });

      combinedSearchCleanup.track(searchableActiveState.id);
      combinedSearchCleanup.track(searchableInactiveState.id);

      // Search for "PaginatedSearch" but only active states with pagination
      const response = await listStatesPaginated({
        searchTerm: 'PaginatedSearch',
        filters: { active: true },
        page: 1,
        pageSize: 10,
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.pagination).toBeDefined();

      // Should include the active state
      expect(response.data.some((s) => s.id === searchableActiveState.id)).toBe(
        true,
      );

      // Should NOT include the inactive state
      expect(
        response.data.some((s) => s.id === searchableInactiveState.id),
      ).toBe(false);

      // All results should be active
      expect(response.data.every((s) => s.active === true)).toBe(true);
    });
  });
});
