import { afterAll, describe, expect, test } from 'vitest';
import { FieldValidationError } from '@repo/base-repo';
import { createCleanupHelper } from '@/tests/shared/test-utils';
import {
  createEventType,
  deleteEventType,
  getEventType,
  listEventTypes,
  listEventTypesPaginated,
  updateEventType,
} from './event-types.controller';

describe('Event Types Controller', () => {
  // Test data and setup - using direct object instead of factory
  const testEventType = {
    name: 'Test Event Type',
    code: 'TET',
    description: 'Test event type description',
    baseTime: 30,
    needsCost: false,
    needsQuantity: false,
    integration: false,
    active: true,
  };

  // Helper function to create unique event type data
  const createUniqueEventTypeData = (
    name: string,
    code: string,
    options = {},
  ) => ({
    name,
    code,
    description: `${name} description`,
    baseTime: 30,
    needsCost: false,
    needsQuantity: false,
    integration: false,
    active: true,
    ...options,
  });

  // Setup cleanup helper
  const eventTypeCleanup = createCleanupHelper(deleteEventType, 'event type');

  // Helper function for creating test event types
  const createTestEventType = async (data = testEventType) => {
    const eventType = await createEventType(data);
    eventTypeCleanup.track(eventType.id);
    return eventType;
  };

  // Variable to store main test event type ID
  let createdEventTypeId: number;

  afterAll(async () => {
    // Clean up all tracked event types
    await eventTypeCleanup.cleanupAll();
  });

  describe('success scenarios', () => {
    test('should create a new event type', async () => {
      // Create a new event type
      const response = await createEventType(testEventType);

      // Store the ID for later tests and cleanup
      createdEventTypeId = response.id;
      eventTypeCleanup.track(createdEventTypeId);

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(testEventType.name);
      expect(response.code).toBe(testEventType.code);
      expect(response.description).toBe(testEventType.description);
      expect(response.baseTime).toBe(testEventType.baseTime);
      expect(response.needsCost).toBe(testEventType.needsCost);
      expect(response.needsQuantity).toBe(testEventType.needsQuantity);
      expect(response.integration).toBe(testEventType.integration);
      expect(response.active).toBe(testEventType.active);
      expect(response.createdAt).toBeDefined();
    });

    test('should retrieve an event type by ID', async () => {
      const response = await getEventType({ id: createdEventTypeId });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdEventTypeId);
      expect(response.name).toBe(testEventType.name);
      expect(response.code).toBe(testEventType.code);
    });

    test('should update an event type', async () => {
      const updatedName = 'Updated Test Event Type';
      const updatedBaseTime = 60;
      const response = await updateEventType({
        id: createdEventTypeId,
        name: updatedName,
        baseTime: updatedBaseTime,
        needsCost: true,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdEventTypeId);
      expect(response.name).toBe(updatedName);
      expect(response.baseTime).toBe(updatedBaseTime);
      expect(response.needsCost).toBe(true);
    });

    test('should create an event type with baseTime = 0', async () => {
      const zeroTimeEventType = {
        name: 'Zero Time Event Type',
        code: 'ZTET',
        description: 'Event type with zero base time',
        baseTime: 0,
        needsCost: false,
        needsQuantity: false,
        integration: false,
        active: true,
      };

      const response = await createEventType(zeroTimeEventType);
      eventTypeCleanup.track(response.id);

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(zeroTimeEventType.name);
      expect(response.code).toBe(zeroTimeEventType.code);
      expect(response.baseTime).toBe(0);
      expect(response.createdAt).toBeDefined();
    });

    test('should use 0 as default when baseTime is not provided', async () => {
      const eventTypeWithoutBaseTime = {
        name: 'Default Time Event Type',
        code: 'DTET2',
        description: 'Event type without baseTime specified',
        // baseTime intentionally omitted
        needsCost: false,
        needsQuantity: false,
        integration: false,
        active: true,
      };

      const response = await createEventType(eventTypeWithoutBaseTime);
      eventTypeCleanup.track(response.id);

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(eventTypeWithoutBaseTime.name);
      expect(response.code).toBe(eventTypeWithoutBaseTime.code);
      expect(response.baseTime).toBe(0); // Should default to 0
      expect(response.createdAt).toBeDefined();
    });

    test('should update an event type to baseTime = 0', async () => {
      // Create an event type with non-zero baseTime first
      const initialEventType = await createTestEventType(
        createUniqueEventTypeData('Update to Zero Time Event Type', 'UZTET', {
          baseTime: 30,
        }),
      );

      // Update to zero baseTime
      const response = await updateEventType({
        id: initialEventType.id,
        baseTime: 0,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(initialEventType.id);
      expect(response.baseTime).toBe(0);
    });

    test('should delete an event type', async () => {
      // Create an event type specifically for deletion test
      const eventTypeToDelete = await createEventType(
        createUniqueEventTypeData('Delete Test Event Type', 'DTET'),
      );

      // Delete should not throw an error
      await expect(
        deleteEventType({ id: eventTypeToDelete.id }),
      ).resolves.not.toThrow();

      // Attempt to get should throw a not found error
      await expect(
        getEventType({ id: eventTypeToDelete.id }),
      ).rejects.toThrow();
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors', async () => {
      await expect(getEventType({ id: 9999 })).rejects.toThrow();
    });

    test('should handle duplicate errors', async () => {
      // Try to create event type with same code as existing one
      await expect(
        createEventType({
          name: 'Duplicate Test Event Type',
          code: testEventType.code, // Same code as existing event type
          description: 'Test event type description',
          baseTime: 30,
          needsCost: false,
          needsQuantity: false,
          integration: false,
          active: true,
        }),
      ).rejects.toThrow();
    });

    describe('field validation errors', () => {
      test('should throw detailed field validation error for duplicate code', async () => {
        // Ensure the test event type exists and get fresh data
        const existingEventType = await getEventType({
          id: createdEventTypeId,
        });

        const duplicateCodePayload = createUniqueEventTypeData(
          'Different Event Type Name',
          existingEventType.code, // Same code as existing event type
        );

        // Verify that the function rejects
        await expect(createEventType(duplicateCodePayload)).rejects.toThrow();

        // Capture the error to make specific assertions
        let validationError: FieldValidationError | undefined;
        try {
          await createEventType(duplicateCodePayload);
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
          existingEventType.code,
        );
      });

      test('should handle update validation errors correctly', async () => {
        // Create another event type to test duplicate on update
        const anotherEventType = await createTestEventType(
          createUniqueEventTypeData('Another Test Event Type', 'ATET'),
        );

        // Ensure the test event type exists and get fresh data
        const existingEventType = await getEventType({
          id: createdEventTypeId,
        });

        const updatePayload = {
          id: anotherEventType.id,
          code: existingEventType.code, // This should trigger duplicate validation
        };

        // Verify that the function rejects
        await expect(updateEventType(updatePayload)).rejects.toThrow();

        // Capture the error to make specific assertions
        let validationError: FieldValidationError | undefined;
        try {
          await updateEventType(updatePayload);
        } catch (error) {
          validationError = error as FieldValidationError;
        }

        expect(validationError).toBeDefined();
        const typedValidationError = validationError as FieldValidationError;
        expect(typedValidationError.name).toBe('FieldValidationError');
        expect(typedValidationError.message).toContain('Validation failed');
        expect(typedValidationError.fieldErrors).toBeDefined();
        expect(typedValidationError.fieldErrors[0].field).toBe('code');
        expect(typedValidationError.fieldErrors[0].code).toBe('DUPLICATE');
      });
    });
  });

  describe('pagination', () => {
    test('should return paginated event types with default parameters', async () => {
      const response = await listEventTypesPaginated({});

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
      const response = await listEventTypesPaginated({
        page: 1,
        pageSize: 5,
      });

      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
      expect(response.data.length).toBeLessThanOrEqual(5);
    });

    test('should default sort by name in ascending order', async () => {
      // Create test event types with different names for verification of default sorting
      const eventTypeA = await createTestEventType(
        createUniqueEventTypeData('AAA Test Event Type', 'AAATET'),
      );
      const eventTypeZ = await createTestEventType(
        createUniqueEventTypeData('ZZZ Test Event Type', 'ZZZTET'),
      );

      // Get event types with large enough page size to include test event types
      const response = await listEventTypesPaginated({
        pageSize: 50,
      });

      // Find the indices of our test event types
      const indexA = response.data.findIndex((et) => et.id === eventTypeA.id);
      const indexZ = response.data.findIndex((et) => et.id === eventTypeZ.id);

      // Verify that eventTypeA (AAA) comes before eventTypeZ (ZZZ) in the results
      // This assumes they both appear in the results (which they should with pageSize: 50)
      if (indexA !== -1 && indexZ !== -1) {
        expect(indexA).toBeLessThan(indexZ);
      }
    });

    test('should return non-paginated list for dropdowns', async () => {
      const response = await listEventTypes({});

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      // No pagination info should be present
      expect(response).not.toHaveProperty('pagination');
    });
  });

  describe('search functionality', () => {
    test('should search event types using searchTerm in list endpoint', async () => {
      // Create a unique event type for search testing
      const searchableEventType = await createTestEventType(
        createUniqueEventTypeData('Searchable Test Event Type', 'STET'),
      );

      // Search for the event type using searchTerm in listEventTypes
      const response = await listEventTypes({ searchTerm: 'Searchable' });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.some((et) => et.id === searchableEventType.id)).toBe(
        true,
      );
    });

    test('should search event types with pagination using searchTerm', async () => {
      const response = await listEventTypesPaginated({
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
      // Create test event types with different active states
      const activeSearchableEventType = await createTestEventType(
        createUniqueEventTypeData('Active Searchable Event Type', 'ASET', {
          active: true,
        }),
      );
      const inactiveSearchableEventType = await createTestEventType(
        createUniqueEventTypeData('Inactive Searchable Event Type', 'ISET', {
          active: false,
        }),
      );

      // Search for "Searchable" but only active event types
      const response = await listEventTypes({
        searchTerm: 'Searchable',
        filters: { active: true },
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      // Should include the active event type
      expect(
        response.data.some((et) => et.id === activeSearchableEventType.id),
      ).toBe(true);

      // Should NOT include the inactive event type
      expect(
        response.data.some((et) => et.id === inactiveSearchableEventType.id),
      ).toBe(false);
    });
  });

  describe('ordering', () => {
    test('should order event types by specified field and direction', async () => {
      const response = await listEventTypes({
        orderBy: [{ field: 'baseTime', direction: 'desc' }],
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      // Verify descending order by baseTime
      if (response.data.length > 1) {
        for (let i = 0; i < response.data.length - 1; i++) {
          expect(response.data[i].baseTime).toBeGreaterThanOrEqual(
            response.data[i + 1].baseTime,
          );
        }
      }
    });

    test('should handle multiple ordering criteria', async () => {
      const response = await listEventTypes({
        orderBy: [
          { field: 'active', direction: 'desc' },
          { field: 'name', direction: 'asc' },
        ],
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      // Basic verification that results are returned
      expect(response.data.length).toBeGreaterThan(0);
    });
  });

  describe('filtering', () => {
    test('should filter event types by active status', async () => {
      // Create test event types with different active states
      const activeEventType = await createTestEventType(
        createUniqueEventTypeData('Active Filter Test Event Type', 'AFTET', {
          active: true,
        }),
      );
      const inactiveEventType = await createTestEventType(
        createUniqueEventTypeData('Inactive Filter Test Event Type', 'IFTET', {
          active: false,
        }),
      );

      // Test filtering for active event types
      const activeResponse = await listEventTypes({
        filters: { active: true },
      });

      expect(activeResponse.data).toBeDefined();
      expect(Array.isArray(activeResponse.data)).toBe(true);
      expect(
        activeResponse.data.some((et) => et.id === activeEventType.id),
      ).toBe(true);
      expect(
        activeResponse.data.some((et) => et.id === inactiveEventType.id),
      ).toBe(false);

      // Test filtering for inactive event types
      const inactiveResponse = await listEventTypes({
        filters: { active: false },
      });

      expect(inactiveResponse.data).toBeDefined();
      expect(Array.isArray(inactiveResponse.data)).toBe(true);
      expect(
        inactiveResponse.data.some((et) => et.id === activeEventType.id),
      ).toBe(false);
      expect(
        inactiveResponse.data.some((et) => et.id === inactiveEventType.id),
      ).toBe(true);
    });
  });
});
