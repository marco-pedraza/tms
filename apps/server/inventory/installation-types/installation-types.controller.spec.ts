import { afterAll, describe, expect, test } from 'vitest';
import {
  createCleanupHelper,
  createTestSuiteId,
  createUniqueCode,
  createUniqueName,
} from '../../tests/shared/test-utils';
import {
  createEventType,
  deleteEventType,
} from '../event-types/event-types.controller';
import type { CreateEventTypePayload } from '../event-types/event-types.types';
import { installationSchemaRepository } from '../installation-schemas/installation-schemas.repository';
import { InstallationSchemaFieldType } from '../installation-schemas/installation-schemas.types';
import type {
  CreateInstallationTypePayload,
  SyncInstallationSchemaPayload,
} from './installation-types.types';
import {
  assignEventTypesToInstallationType,
  createInstallationType,
  deleteInstallationType,
  getInstallationType,
  getInstallationTypeSchema,
  listInstallationTypes,
  listInstallationTypesPaginated,
  syncInstallationSchemas,
  updateInstallationType,
} from './installation-types.controller';

describe('Installation Types Controller', () => {
  const testSuiteId = createTestSuiteId('installation-types-controller');

  // Cleanup helpers using test-utils
  const installationTypeCleanup = createCleanupHelper(async ({ id }) => {
    // First, delete all schemas for this installation type
    try {
      const schemas =
        await installationSchemaRepository.findByInstallationTypeId(id);
      for (const schema of schemas) {
        await installationSchemaRepository.delete(schema.id);
      }
    } catch (error) {
      console.log(
        `Error cleaning up schemas for installation type ${id}:`,
        error,
      );
    }

    // Then delete the installation type
    return await deleteInstallationType({ id });
  }, 'installation type');

  const eventTypeCleanup = createCleanupHelper(deleteEventType, 'event type');

  const installationSchemaCleanup = createCleanupHelper(
    ({ id }) => installationSchemaRepository.delete(id),
    'installation schema',
  );

  // Test data and setup
  const testInstallationType = {
    name: createUniqueName('Test Installation Type', testSuiteId),
    code: createUniqueCode('TEST', 3),
    description: 'Test installation type description',
  };

  // Variable to store created IDs for cleanup
  let createdInstallationTypeId: number;

  /**
   * Helper function to create a test installation type
   */
  async function createTestInstallationType(
    baseName = 'Test Installation Type',
    code = 'TEST',
    options: Partial<CreateInstallationTypePayload> = {},
  ) {
    const uniqueName = createUniqueName(baseName, testSuiteId);
    const uniqueCode = createUniqueCode(code, 3);
    const data = {
      name: uniqueName,
      code: uniqueCode,
      description: 'Test installation type description',
      ...options,
    };

    const installationType = await createInstallationType(data);
    return installationTypeCleanup.track(installationType.id);
  }

  /**
   * Helper function to create a test event type with automatic cleanup
   */
  async function createTestEventType(
    baseName = 'Test Event Type',
    code = 'TET',
    options: Partial<CreateEventTypePayload> = {},
  ) {
    const uniqueName = createUniqueName(baseName, testSuiteId);
    const uniqueCode = createUniqueCode(code, 3);
    const data = {
      name: uniqueName,
      code: uniqueCode,
      description: 'Test event type description',
      baseTime: 30,
      needsCost: false,
      needsQuantity: false,
      integration: false,
      active: true,
      ...options,
    };

    const eventType = await createEventType(data);
    return eventTypeCleanup.track(eventType.id);
  }

  afterAll(async () => {
    // Clean up all tracked resources using test-utils
    await installationSchemaCleanup.cleanupAll();
    await installationTypeCleanup.cleanupAll();
    await eventTypeCleanup.cleanupAll();

    if (createdInstallationTypeId) {
      try {
        const remainingSchemas =
          await installationSchemaRepository.findByInstallationTypeId(
            createdInstallationTypeId,
          );
        for (const schema of remainingSchemas) {
          await installationSchemaRepository.delete(schema.id);
        }

        await deleteInstallationType({ id: createdInstallationTypeId });
      } catch (error) {
        console.log('Error cleaning up main test installation type:', error);
      }
    }
  });

  describe('success scenarios', () => {
    test('should create a new installation type', async () => {
      const response = await createInstallationType(testInstallationType);

      // Store the ID for later cleanup
      createdInstallationTypeId = response.id;

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(testInstallationType.name);
      expect(response.description).toBe(testInstallationType.description);
      expect(response.createdAt).toBeDefined();
    });

    test('should retrieve an installation type by ID', async () => {
      const response = await getInstallationType({
        id: createdInstallationTypeId,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdInstallationTypeId);
      expect(response.name).toBe(testInstallationType.name);
    });

    test('should update an installation type', async () => {
      const updatedName = createUniqueName(
        'Updated Test Installation Type',
        testSuiteId,
      );
      const response = await updateInstallationType({
        id: createdInstallationTypeId,
        name: updatedName,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdInstallationTypeId);
      expect(response.name).toBe(updatedName);
    });

    test('should delete an installation type', async () => {
      // Create an installation type specifically for deletion test
      const installationTypeToDeleteId = await createTestInstallationType(
        'Installation Type To Delete',
        'ITD',
        {
          description: 'Installation type to be deleted',
        },
      );

      // Delete should not throw an error
      await expect(
        deleteInstallationType({ id: installationTypeToDeleteId }),
      ).resolves.not.toThrow();

      // Attempt to get should throw a not found error
      await expect(
        getInstallationType({ id: installationTypeToDeleteId }),
      ).rejects.toThrow();
    });

    test('should assign event types to installation type', async () => {
      // Create test event types using helper (automatic cleanup)
      const eventType1Id = await createTestEventType('Event Type 1', 'ET1', {
        description: 'Test event type 1',
        baseTime: 30,
        needsCost: false,
        needsQuantity: false,
        integration: false,
        active: true,
      });

      const eventType2Id = await createTestEventType('Event Type 2', 'ET2', {
        description: 'Test event type 2',
        baseTime: 45,
        needsCost: true,
        needsQuantity: false,
        integration: false,
        active: true,
      });

      try {
        // Assign event types to installation type
        const response = await assignEventTypesToInstallationType({
          id: createdInstallationTypeId,
          eventTypeIds: [eventType1Id, eventType2Id],
        });

        // Verify response structure
        expect(response).toBeDefined();
        expect(response.eventTypes).toBeDefined();
        expect(Array.isArray(response.eventTypes)).toBe(true);
        expect(response.eventTypes).toHaveLength(2);

        // Verify installation type properties
        expect(response.id).toBe(createdInstallationTypeId);
        expect(response.name).toBeDefined();
        expect(response.code).toBeDefined();

        // Verify event types are included correctly
        const eventTypeIds = response.eventTypes.map((et) => et.id);
        expect(eventTypeIds).toContain(eventType1Id);
        expect(eventTypeIds).toContain(eventType2Id);

        // Verify event types have correct properties
        const eventType1 = response.eventTypes.find(
          (et) => et.id === eventType1Id,
        );
        const eventType2 = response.eventTypes.find(
          (et) => et.id === eventType2Id,
        );

        expect(eventType1).toBeDefined();
        expect(eventType1?.name).toMatch(/^Event Type 1/);
        expect(eventType1?.id).toBe(eventType1Id);

        expect(eventType2).toBeDefined();
        expect(eventType2?.name).toMatch(/^Event Type 2/);
        expect(eventType2?.id).toBe(eventType2Id);
      } finally {
        // Clean up assignments regardless of test success or failure
        await assignEventTypesToInstallationType({
          id: createdInstallationTypeId,
          eventTypeIds: [],
        });
      }
    });

    test('should replace existing event type assignments (destructive)', async () => {
      // Create test event types using helper (automatic cleanup)
      const eventType1Id = await createTestEventType(
        'Event Type Replace 1',
        'ETR1',
        {
          description: 'Test event type replace 1',
          baseTime: 30,
          needsCost: false,
          needsQuantity: false,
          integration: false,
          active: true,
        },
      );

      const eventType2Id = await createTestEventType(
        'Event Type Replace 2',
        'ETR2',
        {
          description: 'Test event type replace 2',
          baseTime: 45,
          needsCost: true,
          needsQuantity: false,
          integration: false,
          active: true,
        },
      );

      const eventType3Id = await createTestEventType(
        'Event Type Replace 3',
        'ETR3',
        {
          description: 'Test event type replace 3',
          baseTime: 60,
          needsCost: false,
          needsQuantity: true,
          integration: false,
          active: true,
        },
      );

      try {
        // First assignment
        const firstResponse = await assignEventTypesToInstallationType({
          id: createdInstallationTypeId,
          eventTypeIds: [eventType1Id, eventType2Id],
        });

        expect(firstResponse.eventTypes).toHaveLength(2);

        // Second assignment (should replace first)
        const secondResponse = await assignEventTypesToInstallationType({
          id: createdInstallationTypeId,
          eventTypeIds: [eventType3Id],
        });

        expect(secondResponse.eventTypes).toHaveLength(1);
        expect(secondResponse.eventTypes[0]?.id).toBe(eventType3Id);
        expect(secondResponse.id).toBe(createdInstallationTypeId);
      } finally {
        // Clean up assignments regardless of test success or failure
        await assignEventTypesToInstallationType({
          id: createdInstallationTypeId,
          eventTypeIds: [],
        });
      }
    });

    test('should get event types assigned to installation type', async () => {
      // Create test event types using helper (automatic cleanup)
      const eventType1Id = await createTestEventType(
        'Get Event Type 1',
        'GET1',
        {
          description: 'Test event type get 1',
          baseTime: 30,
          needsCost: false,
          needsQuantity: false,
          integration: false,
          active: true,
        },
      );

      const eventType2Id = await createTestEventType(
        'Get Event Type 2',
        'GET2',
        {
          description: 'Test event type get 2',
          baseTime: 45,
          needsCost: true,
          needsQuantity: false,
          integration: false,
          active: true,
        },
      );

      try {
        // Assign event types to installation type
        await assignEventTypesToInstallationType({
          id: createdInstallationTypeId,
          eventTypeIds: [eventType1Id, eventType2Id],
        });

        // Get assigned event types
        const response = await getInstallationType({
          id: createdInstallationTypeId,
        });

        // Verify response structure
        expect(response).toBeDefined();
        expect(response.eventTypes).toBeDefined();
        expect(Array.isArray(response.eventTypes)).toBe(true);
        expect(response.eventTypes).toHaveLength(2);

        // Verify event types are included correctly
        const eventTypeIds = response.eventTypes.map((et) => et.id);
        expect(eventTypeIds).toContain(eventType1Id);
        expect(eventTypeIds).toContain(eventType2Id);

        // Verify event types have correct properties
        const eventType1 = response.eventTypes.find(
          (et) => et.id === eventType1Id,
        );
        const eventType2 = response.eventTypes.find(
          (et) => et.id === eventType2Id,
        );

        expect(eventType1).toBeDefined();
        expect(eventType1?.name).toMatch(/^Get Event Type 1/);
        expect(eventType1?.id).toBe(eventType1Id);

        expect(eventType2).toBeDefined();
        expect(eventType2?.name).toMatch(/^Get Event Type 2/);
        expect(eventType2?.id).toBe(eventType2Id);
      } finally {
        // Clean up assignments regardless of test success or failure
        await assignEventTypesToInstallationType({
          id: createdInstallationTypeId,
          eventTypeIds: [],
        });
      }
    });

    test('should handle empty event type array', async () => {
      // Assign empty array (should remove all assignments)
      const response = await assignEventTypesToInstallationType({
        id: createdInstallationTypeId,
        eventTypeIds: [],
      });

      expect(response).toBeDefined();
      expect(response.eventTypes).toBeDefined();
      expect(Array.isArray(response.eventTypes)).toBe(true);
      expect(response.eventTypes).toHaveLength(0);
    });

    test('should return empty array when no event types are assigned', async () => {
      // Get event types for installation type with no assignments
      const response = await getInstallationType({
        id: createdInstallationTypeId,
      });

      expect(response).toBeDefined();
      expect(response.eventTypes).toBeDefined();
      expect(Array.isArray(response.eventTypes)).toBe(true);
      expect(response.eventTypes).toHaveLength(0);
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors', async () => {
      await expect(getInstallationType({ id: 9999 })).rejects.toThrow();
    });

    test('should handle not found errors for update', async () => {
      await expect(
        updateInstallationType({
          id: 9999,
          name: 'Non-existent Installation Type',
        }),
      ).rejects.toThrow();
    });

    test('should handle not found errors for delete', async () => {
      await expect(deleteInstallationType({ id: 9999 })).rejects.toThrow();
    });

    test('should handle not found errors for installation type assignment', async () => {
      await expect(
        assignEventTypesToInstallationType({
          id: 9999,
          eventTypeIds: [1, 2],
        }),
      ).rejects.toThrow();
    });

    test('should handle not found errors for event types assignment', async () => {
      await expect(
        assignEventTypesToInstallationType({
          id: createdInstallationTypeId,
          eventTypeIds: [9999, 8888],
        }),
      ).rejects.toThrow();
    });

    test('should handle mixed valid and invalid event type IDs', async () => {
      // Create a valid event type using helper (automatic cleanup)
      const validEventTypeId = await createTestEventType(
        'Valid Event Type',
        'VET',
        {
          description: 'Valid event type',
          baseTime: 30,
          needsCost: false,
          needsQuantity: false,
          integration: false,
          active: true,
        },
      );

      // Try to assign both valid and invalid event type IDs
      await expect(
        assignEventTypesToInstallationType({
          id: createdInstallationTypeId,
          eventTypeIds: [validEventTypeId, 9999],
        }),
      ).rejects.toThrow();
    });

    test('should handle not found errors for get event types', async () => {
      await expect(getInstallationType({ id: 9999 })).rejects.toThrow();
    });
  });

  describe('pagination', () => {
    test('should return paginated installation types with default parameters', async () => {
      const response = await listInstallationTypesPaginated({});

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
      const response = await listInstallationTypesPaginated({
        page: 1,
        pageSize: 5,
      });

      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(5);
      expect(response.data.length).toBeLessThanOrEqual(5);
    });

    test('should return non-paginated list for dropdowns', async () => {
      const response = await listInstallationTypes({});

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      // No pagination info should be present
      expect(response).not.toHaveProperty('pagination');
    });
  });

  describe('search functionality', () => {
    test('should search installation types using searchTerm in list endpoint', async () => {
      // Create a unique installation type for search testing
      const searchableInstallationTypeId = await createTestInstallationType(
        'Searchable Test Installation Type',
        'STT',
        {
          description: 'Searchable description',
        },
      );

      // Search for the installation type
      const response = await listInstallationTypes({
        searchTerm: 'Searchable',
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);

      // Check if our test installation type is in the results
      const foundInstallationType = response.data.find(
        (it) => it.id === searchableInstallationTypeId,
      );
      expect(foundInstallationType).toBeDefined();
    });

    test('should search installation types using searchTerm in paginated endpoint', async () => {
      // Search for installation types containing "Test"
      const response = await listInstallationTypesPaginated({
        searchTerm: 'Test',
        page: 1,
        pageSize: 10,
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.pagination).toBeDefined();

      // All results should contain "Test" in name or description
      response.data.forEach((installationType) => {
        const nameContainsTest = installationType.name
          .toLowerCase()
          .includes('test');
        const descriptionContainsTest = installationType.description
          ?.toLowerCase()
          .includes('test');
        expect(nameContainsTest || descriptionContainsTest).toBe(true);
      });
    });

    test('should return empty results for non-matching search', async () => {
      const response = await listInstallationTypes({
        searchTerm: 'NonExistentSearchTerm12345',
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBe(0);
    });
  });

  describe('ordering', () => {
    test('should order installation types by name ascending', async () => {
      const response = await listInstallationTypes({
        orderBy: [{ field: 'name', direction: 'asc' }],
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      if (response.data.length > 1) {
        for (let i = 1; i < response.data.length; i++) {
          expect(response.data[i - 1].name <= response.data[i].name).toBe(true);
        }
      }
    });

    test('should order installation types by name descending', async () => {
      const response = await listInstallationTypes({
        orderBy: [{ field: 'name', direction: 'desc' }],
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      if (response.data.length > 1) {
        for (let i = 1; i < response.data.length; i++) {
          expect(response.data[i - 1].name >= response.data[i].name).toBe(true);
        }
      }
    });
  });

  describe('schema management', () => {
    test('should get installation schema for a type', async () => {
      const response = await getInstallationTypeSchema({
        id: createdInstallationTypeId,
      });

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      // Initially should be empty
      expect(response.data.length).toBe(0);
    });

    test('should sync installation schemas - create new schemas', async () => {
      const schemas: SyncInstallationSchemaPayload[] = [
        {
          name: 'capacity',
          description: 'Maximum capacity of the installation',
          type: InstallationSchemaFieldType.NUMBER,
          required: true,
        },
        {
          name: 'location_type',
          description: 'Type of location',
          type: InstallationSchemaFieldType.ENUM,
          required: true,
          options: {
            enumValues: ['indoor', 'outdoor', 'mixed'],
          },
        },
        {
          name: 'notes',
          description: 'Optional notes about the installation',
          type: InstallationSchemaFieldType.LONG_TEXT,
          required: false,
        },
      ];

      const response = await syncInstallationSchemas({
        id: createdInstallationTypeId,
        schemas,
      });

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBe(3);

      // Check that schemas were created correctly
      const capacitySchema = response.data.find((s) => s.name === 'capacity');
      expect(capacitySchema).toBeDefined();
      expect(capacitySchema?.type).toBe(InstallationSchemaFieldType.NUMBER);
      expect(capacitySchema?.required).toBe(true);

      const locationSchema = response.data.find(
        (s) => s.name === 'location_type',
      );
      expect(locationSchema).toBeDefined();
      expect(locationSchema?.type).toBe(InstallationSchemaFieldType.ENUM);
      expect(locationSchema?.options?.enumValues).toEqual([
        'indoor',
        'outdoor',
        'mixed',
      ]);

      const notesSchema = response.data.find((s) => s.name === 'notes');
      expect(notesSchema).toBeDefined();
      expect(notesSchema?.type).toBe(InstallationSchemaFieldType.LONG_TEXT);
      expect(notesSchema?.required).toBe(false);
    });

    test('should sync installation schemas - update existing schemas', async () => {
      // First, get current schemas
      const currentSchemas = await getInstallationTypeSchema({
        id: createdInstallationTypeId,
      });

      expect(currentSchemas.data.length).toBe(3);

      // Update schemas - modify existing ones
      const updatedSchemas: SyncInstallationSchemaPayload[] = [
        {
          id: currentSchemas.data.find((s) => s.name === 'capacity')?.id,
          name: 'capacity',
          description: 'Updated: Maximum capacity of the installation',
          type: InstallationSchemaFieldType.NUMBER,
          required: true,
        },
        {
          id: currentSchemas.data.find((s) => s.name === 'location_type')?.id,
          name: 'location_type',
          description: 'Type of location',
          type: InstallationSchemaFieldType.ENUM,
          required: true,
          options: {
            enumValues: ['indoor', 'outdoor', 'mixed', 'hybrid'],
          },
        },
        // Remove notes schema by not including it
      ];

      const response = await syncInstallationSchemas({
        id: createdInstallationTypeId,
        schemas: updatedSchemas,
      });

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBe(2); // One schema was removed

      // Check that schemas were updated correctly
      const capacitySchema = response.data.find((s) => s.name === 'capacity');
      expect(capacitySchema).toBeDefined();
      expect(capacitySchema?.description).toBe(
        'Updated: Maximum capacity of the installation',
      );

      const locationSchema = response.data.find(
        (s) => s.name === 'location_type',
      );
      expect(locationSchema).toBeDefined();
      expect(locationSchema?.options?.enumValues).toEqual([
        'indoor',
        'outdoor',
        'mixed',
        'hybrid',
      ]);

      // Notes schema should be removed
      const notesSchema = response.data.find((s) => s.name === 'notes');
      expect(notesSchema).toBeUndefined();
    });

    test('should sync installation schemas - create, update, and delete in one operation', async () => {
      // Start fresh with a new installation type
      const newInstallationTypeId = await createTestInstallationType(
        'Schema Sync Test Installation Type',
        'SSTT',
        {
          description: 'For testing schema sync operations',
        },
      );

      // Create initial schemas
      const initialSchemas: SyncInstallationSchemaPayload[] = [
        {
          name: 'height',
          description: 'Height in meters',
          type: InstallationSchemaFieldType.NUMBER,
          required: true,
        },
        {
          name: 'material',
          description: 'Construction material',
          type: InstallationSchemaFieldType.STRING,
          required: true,
        },
      ];

      const initialResponse = await syncInstallationSchemas({
        id: newInstallationTypeId,
        schemas: initialSchemas,
      });

      expect(initialResponse.data.length).toBe(2);

      // Now perform complex sync: update height, delete material, add new width
      const complexSyncSchemas: SyncInstallationSchemaPayload[] = [
        {
          id: initialResponse.data.find((s) => s.name === 'height')?.id,
          name: 'height',
          description: 'Updated: Height in meters',
          type: InstallationSchemaFieldType.NUMBER,
          required: false, // Changed from required to optional
        },
        // material is not included, so it will be deleted
        {
          // No id, so this will be created
          name: 'width',
          description: 'Width in meters',
          type: InstallationSchemaFieldType.NUMBER,
          required: true,
        },
      ];

      const complexResponse = await syncInstallationSchemas({
        id: newInstallationTypeId,
        schemas: complexSyncSchemas,
      });

      expect(complexResponse.data.length).toBe(2);

      // Check updated height schema
      const heightSchema = complexResponse.data.find(
        (s) => s.name === 'height',
      );
      expect(heightSchema).toBeDefined();
      expect(heightSchema?.required).toBe(false);

      // Check new width schema
      const widthSchema = complexResponse.data.find((s) => s.name === 'width');
      expect(widthSchema).toBeDefined();
      expect(widthSchema?.required).toBe(true);

      // Check that material schema was deleted
      const materialSchema = complexResponse.data.find(
        (s) => s.name === 'material',
      );
      expect(materialSchema).toBeUndefined();
    });

    test('should handle empty schema sync', async () => {
      // Create a new installation type
      const newInstallationTypeId = await createTestInstallationType(
        'Empty Schema Test Installation Type',
        'ESTT',
        {
          description: 'For testing empty schema sync',
        },
      );

      // Sync with empty array should work
      const response = await syncInstallationSchemas({
        id: newInstallationTypeId,
        schemas: [],
      });

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBe(0);
    });

    test('should handle schema sync errors - invalid installation type', async () => {
      const schemas: SyncInstallationSchemaPayload[] = [
        {
          name: 'test_field',
          type: InstallationSchemaFieldType.STRING,
          required: false,
        },
      ];

      await expect(
        syncInstallationSchemas({
          id: 99999, // Non-existent installation type
          schemas,
        }),
      ).rejects.toThrow();
    });

    test('should handle schema sync with validation errors', async () => {
      const invalidSchemas: SyncInstallationSchemaPayload[] = [
        {
          name: 'invalid_enum',
          type: InstallationSchemaFieldType.ENUM,
          required: false,
          // Missing enumValues in options - should cause validation error
          options: {
            enumValues: [], // Empty array should cause validation error
          },
        },
      ];

      await expect(
        syncInstallationSchemas({
          id: createdInstallationTypeId,
          schemas: invalidSchemas,
        }),
      ).rejects.toThrow();
    });

    test('should handle duplicate schema names in same request', async () => {
      const duplicateSchemas: SyncInstallationSchemaPayload[] = [
        {
          name: 'duplicate_name',
          type: InstallationSchemaFieldType.STRING,
          required: false,
        },
        {
          name: 'duplicate_name', // Same name as above
          type: InstallationSchemaFieldType.NUMBER,
          required: true,
        },
      ];

      await expect(
        syncInstallationSchemas({
          id: createdInstallationTypeId,
          schemas: duplicateSchemas,
        }),
      ).rejects.toThrow();
    });

    test('should allow reusing name when deleting a schema and creating a new one with same name', async () => {
      // First, create some initial schemas
      const initialSchemas: SyncInstallationSchemaPayload[] = [
        {
          name: 'Schema A',
          type: InstallationSchemaFieldType.STRING,
          required: true,
        },
        {
          name: 'Schema B',
          type: InstallationSchemaFieldType.NUMBER,
          required: true,
        },
      ];

      const firstSync = await syncInstallationSchemas({
        id: createdInstallationTypeId,
        schemas: initialSchemas,
      });

      expect(firstSync.data).toHaveLength(2);
      const schemaA = firstSync.data.find((s) => s.name === 'Schema A');
      const schemaB = firstSync.data.find((s) => s.name === 'Schema B');
      expect(schemaA).toBeDefined();
      expect(schemaB).toBeDefined();

      // Now simulate the user's scenario:
      // Keep Schema A, delete Schema B, create a new Schema B with different type
      const syncSchemas: SyncInstallationSchemaPayload[] = [
        {
          id: schemaA?.id,
          name: 'Schema A',
          type: InstallationSchemaFieldType.STRING,
          required: true,
        },
        // Note: Schema B is omitted (will be deleted), and we create a new one with same name
        {
          name: 'Schema B', // Same name as deleted schema but different type
          type: InstallationSchemaFieldType.BOOLEAN, // Changed from NUMBER to BOOLEAN
          required: false,
        },
      ];

      // This should succeed - the old Schema B is deleted and a new one is created
      const result = await syncInstallationSchemas({
        id: createdInstallationTypeId,
        schemas: syncSchemas,
      });

      expect(result.data).toHaveLength(2);

      // Verify Schema A was preserved
      const preservedSchemaA = result.data.find((s) => s.name === 'Schema A');
      expect(preservedSchemaA?.id).toBe(schemaA?.id); // Same ID
      expect(preservedSchemaA?.type).toBe(InstallationSchemaFieldType.STRING);

      // Verify new Schema B was created (different ID but same name)
      const newSchemaB = result.data.find((s) => s.name === 'Schema B');
      expect(newSchemaB?.id).not.toBe(schemaB?.id); // Different ID
      expect(newSchemaB?.type).toBe(InstallationSchemaFieldType.BOOLEAN);
      expect(newSchemaB?.required).toBe(false);
    });

    test('should handle unsupported field types', async () => {
      const unsupportedTypeSchemas: SyncInstallationSchemaPayload[] = [
        {
          name: 'unsupported_field',
          type: 'unsupported_type' as InstallationSchemaFieldType,
          required: false,
        },
      ];

      await expect(
        syncInstallationSchemas({
          id: createdInstallationTypeId,
          schemas: unsupportedTypeSchemas,
        }),
      ).rejects.toThrow();
    });

    test('should handle enum with invalid option values', async () => {
      const invalidEnumSchemas: SyncInstallationSchemaPayload[] = [
        {
          name: 'invalid_enum_values',
          type: InstallationSchemaFieldType.ENUM,
          required: false,
          options: {
            enumValues: ['valid', '', 'another_valid'] as string[], // Empty string should cause error
          },
        },
      ];

      await expect(
        syncInstallationSchemas({
          id: createdInstallationTypeId,
          schemas: invalidEnumSchemas,
        }),
      ).rejects.toThrow();
    });

    test('should handle non-enum types with options', async () => {
      const stringWithOptionsSchemas: SyncInstallationSchemaPayload[] = [
        {
          name: 'string_with_options',
          type: InstallationSchemaFieldType.STRING,
          required: false,
          options: {
            enumValues: ['should', 'not', 'have', 'options'], // STRING type should not have options
          },
        },
      ];

      await expect(
        syncInstallationSchemas({
          id: createdInstallationTypeId,
          schemas: stringWithOptionsSchemas,
        }),
      ).rejects.toThrow();
    });

    test('should handle multiple validation errors simultaneously', async () => {
      const multipleErrorSchemas: SyncInstallationSchemaPayload[] = [
        {
          name: 'duplicate_name',
          type: InstallationSchemaFieldType.STRING,
          required: false,
        },
        {
          name: 'duplicate_name', // Duplicate name
          type: InstallationSchemaFieldType.ENUM,
          required: true,
          options: {
            enumValues: [], // Empty enum values
          },
        },
        {
          name: 'invalid_type_with_options',
          type: InstallationSchemaFieldType.NUMBER,
          required: false,
          options: {
            enumValues: ['should', 'not', 'exist'], // NUMBER type should not have options
          },
        },
      ];

      await expect(
        syncInstallationSchemas({
          id: createdInstallationTypeId,
          schemas: multipleErrorSchemas,
        }),
      ).rejects.toThrow();
    });
  });
});
