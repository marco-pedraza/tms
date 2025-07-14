import { afterAll, describe, expect, test } from 'vitest';
import {
  createCleanupHelper,
  createTestSuiteId,
  createUniqueCode,
  createUniqueName,
} from '../../tests/shared/test-utils';
import { InstallationSchemaFieldType } from '../installation-schemas/installation-schemas.types';
import type {
  CreateInstallationTypePayload,
  SyncInstallationSchemaPayload,
} from './installation-types.types';
import {
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

  // Cleanup helper using test-utils
  const installationTypeCleanup = createCleanupHelper(
    deleteInstallationType,
    'installation type',
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

  afterAll(async () => {
    // Clean up all tracked installation types using test-utils
    await installationTypeCleanup.cleanupAll();

    // Also clean up the main test installation type if it exists
    if (createdInstallationTypeId) {
      try {
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
          label: 'Capacity',
          description: 'Maximum capacity of the installation',
          type: InstallationSchemaFieldType.NUMBER,
          required: true,
        },
        {
          name: 'location_type',
          label: 'Location Type',
          description: 'Type of location',
          type: InstallationSchemaFieldType.ENUM,
          required: true,
          options: {
            enumValues: ['indoor', 'outdoor', 'mixed'],
          },
        },
        {
          name: 'notes',
          label: 'Additional Notes',
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
      expect(capacitySchema?.label).toBe('Capacity');
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
          label: 'Maximum Capacity',
          description: 'Updated: Maximum capacity of the installation',
          type: InstallationSchemaFieldType.NUMBER,
          required: true,
        },
        {
          id: currentSchemas.data.find((s) => s.name === 'location_type')?.id,
          name: 'location_type',
          label: 'Location Type',
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
      expect(capacitySchema?.label).toBe('Maximum Capacity');
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
        {
          description: 'For testing schema sync operations',
        },
      );

      // Create initial schemas
      const initialSchemas: SyncInstallationSchemaPayload[] = [
        {
          name: 'height',
          label: 'Height',
          description: 'Height in meters',
          type: InstallationSchemaFieldType.NUMBER,
          required: true,
        },
        {
          name: 'material',
          label: 'Material',
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
          label: 'Height (Updated)',
          description: 'Updated: Height in meters',
          type: InstallationSchemaFieldType.NUMBER,
          required: false, // Changed from required to optional
        },
        // material is not included, so it will be deleted
        {
          // No id, so this will be created
          name: 'width',
          label: 'Width',
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
      expect(heightSchema?.label).toBe('Height (Updated)');
      expect(heightSchema?.required).toBe(false);

      // Check new width schema
      const widthSchema = complexResponse.data.find((s) => s.name === 'width');
      expect(widthSchema).toBeDefined();
      expect(widthSchema?.label).toBe('Width');
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
          label: 'Test Field',
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
          label: 'Invalid Enum',
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
          label: 'First Schema',
          type: InstallationSchemaFieldType.STRING,
          required: false,
        },
        {
          name: 'duplicate_name', // Same name as above
          label: 'Second Schema',
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

    test('should handle unsupported field types', async () => {
      const unsupportedTypeSchemas: SyncInstallationSchemaPayload[] = [
        {
          name: 'unsupported_field',
          label: 'Unsupported Field',
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
          label: 'Invalid Enum Values',
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
          label: 'String With Options',
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
          label: 'First Duplicate',
          type: InstallationSchemaFieldType.STRING,
          required: false,
        },
        {
          name: 'duplicate_name', // Duplicate name
          label: 'Second Duplicate',
          type: InstallationSchemaFieldType.ENUM,
          required: true,
          options: {
            enumValues: [], // Empty enum values
          },
        },
        {
          name: 'invalid_type_with_options',
          label: 'Invalid Type With Options',
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
