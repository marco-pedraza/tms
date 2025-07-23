import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { FieldValidationError } from '@repo/base-repo';
import { createCleanupHelper } from '../../tests/shared/test-utils';
import {
  createInstallationType,
  deleteInstallationType,
} from '../installation-types/installation-types.controller';
import { InstallationSchemaFieldType } from './installation-schemas.types';
import { installationSchemaRepository } from './installation-schemas.repository';
import {
  createInstallationSchema,
  getInstallationSchema,
  listInstallationSchemas,
  listInstallationSchemasPaginated,
  updateInstallationSchema,
} from './installation-schemas.controller';

describe('Installation Schemas Controller', () => {
  // Test data
  const testInstallationType = {
    name: 'Test Installation Type for Schema',
    code: 'TIT',
    description: 'Test installation type for schema testing',
  };

  const testInstallationSchema = {
    name: 'test_field',
    description: 'Test field description for testing purposes',
    type: InstallationSchemaFieldType.STRING,
    required: true,
    installationTypeId: 0, // Will be set after creating installation type
  };

  // Variables to store created IDs for cleanup
  let createdInstallationTypeId: number;
  let createdInstallationSchemaId: number;

  const schemaCleanup = createCleanupHelper(
    ({ id }) => installationSchemaRepository.delete(id),
    'installation schema',
  );

  beforeAll(async () => {
    // Create installation type for testing
    const installationType = await createInstallationType(testInstallationType);
    createdInstallationTypeId = installationType.id;
    testInstallationSchema.installationTypeId = installationType.id;
  });

  afterAll(async () => {
    // Clean up all created schemas first
    await schemaCleanup.cleanupAll();
  });

  describe('success scenarios', () => {
    test('should create a new installation schema', async () => {
      // Create a new installation schema
      const response = await createInstallationSchema(testInstallationSchema);

      // Store the ID for later cleanup
      createdInstallationSchemaId = schemaCleanup.track(response.id);

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(testInstallationSchema.name);
      expect(response.description).toBe(testInstallationSchema.description);
      expect(response.type).toBe(testInstallationSchema.type);
      expect(response.required).toBe(testInstallationSchema.required);
      expect(response.installationTypeId).toBe(
        testInstallationSchema.installationTypeId,
      );
    });

    test('should retrieve an installation schema by ID', async () => {
      const response = await getInstallationSchema({
        id: createdInstallationSchemaId,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdInstallationSchemaId);
      expect(response.name).toBe(testInstallationSchema.name);
      expect(response.description).toBe(testInstallationSchema.description);
    });

    test('should retrieve an installation schema with relations by ID', async () => {
      const response = await getInstallationSchema({
        id: createdInstallationSchemaId,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdInstallationSchemaId);
      expect(response.name).toBe(testInstallationSchema.name);
      expect(response.installationType).toBeDefined();
      expect(response.installationType.id).toBe(createdInstallationTypeId);
      expect(response.installationType.name).toBe(testInstallationType.name);
    });

    test('should update an installation schema', async () => {
      const updatedDescription = 'Updated description for test field';
      const updatedRequired = false;
      const response = await updateInstallationSchema({
        id: createdInstallationSchemaId,
        description: updatedDescription,
        required: updatedRequired,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdInstallationSchemaId);
      expect(response.description).toBe(updatedDescription);
      expect(response.required).toBe(updatedRequired);
      expect(response.name).toBe(testInstallationSchema.name); // Should remain unchanged
    });

    test('should list installation schemas without pagination', async () => {
      const response = await listInstallationSchemas({});

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);

      const foundSchema = response.data.find(
        (schema) => schema.id === createdInstallationSchemaId,
      );
      expect(foundSchema).toBeDefined();
    });

    test('should list installation schemas with pagination and relations', async () => {
      const response = await listInstallationSchemasPaginated({
        page: 1,
        pageSize: 10,
      });

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.pagination).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.pagination.currentPage).toBe(1);
      expect(response.pagination.pageSize).toBe(10);
      expect(response.pagination.totalCount).toBeGreaterThan(0);

      // Verify that relations are included in paginated results
      if (response.data.length > 0) {
        const firstSchema = response.data[0];
        expect(firstSchema.installationType).toBeDefined();
        expect(firstSchema.installationType.id).toBeDefined();
        expect(firstSchema.installationType.name).toBeDefined();
      }
    });

    test('should list installation schemas with search', async () => {
      const response = await listInstallationSchemas({
        searchTerm: testInstallationSchema.name,
      });

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      const foundSchema = response.data.find(
        (schema) => schema.name === testInstallationSchema.name,
      );
      expect(foundSchema).toBeDefined();
    });

    test('should create installation schema with different field types', async () => {
      // Test with number type (no specific options required)
      const numberSchema = {
        name: 'test_number',
        description: 'A numeric field for testing',
        type: InstallationSchemaFieldType.NUMBER,
        required: false,
        installationTypeId: createdInstallationTypeId,
      };

      const numberResponse = await createInstallationSchema(numberSchema);
      schemaCleanup.track(numberResponse.id);
      expect(numberResponse.type).toBe(InstallationSchemaFieldType.NUMBER);

      // Test with enum type (only enumValues required)
      const enumSchema = {
        name: 'test_enum',
        description: 'An enum field with predefined options',
        type: InstallationSchemaFieldType.ENUM,
        options: {
          enumValues: ['option1', 'option2', 'option3'],
        },
        required: true,
        installationTypeId: createdInstallationTypeId,
      };

      const enumResponse = await createInstallationSchema(enumSchema);
      schemaCleanup.track(enumResponse.id);
      expect(enumResponse.type).toBe(InstallationSchemaFieldType.ENUM);
      expect(enumResponse.options.enumValues).toEqual([
        'option1',
        'option2',
        'option3',
      ]);
    });

    test('should create installation schema without description (optional field)', async () => {
      const schemaWithoutDescription = {
        name: 'no_description_field',
        type: InstallationSchemaFieldType.STRING,
        required: false,
        installationTypeId: createdInstallationTypeId,
      };

      const response = await createInstallationSchema(schemaWithoutDescription);
      schemaCleanup.track(response.id);

      expect(response).toBeDefined();
      expect(response.name).toBe(schemaWithoutDescription.name);
      expect(response.description).toBeNull(); // Should be null when not provided
      expect(response.type).toBe(schemaWithoutDescription.type);
    });
  });

  describe('error scenarios', () => {
    test('should handle not found errors', async () => {
      await expect(getInstallationSchema({ id: 9999 })).rejects.toThrow();
    });

    test('should handle validation errors for duplicate names within same installation type', async () => {
      // Try to create another schema with the same name and installation type
      const duplicatePayload = {
        ...testInstallationSchema,
      };

      await expect(
        createInstallationSchema(duplicatePayload),
      ).rejects.toThrow();

      // Validate specific error code
      let validationError: FieldValidationError | undefined;
      try {
        await createInstallationSchema(duplicatePayload);
      } catch (error) {
        validationError = error as FieldValidationError;
      }

      expect(validationError).toBeDefined();
      expect(validationError?.name).toBe('FieldValidationError');
      expect(validationError?.fieldErrors).toBeDefined();
      expect(validationError?.fieldErrors[0].field).toBe('name');
      expect(validationError?.fieldErrors[0].code).toBe('DUPLICATE');
    });

    test('should allow duplicate names across different installation types', async () => {
      // Create a second installation type
      const secondInstallationType = {
        name: 'Second Test Type',
        code: 'STIT',
        description: 'Second test installation type',
      };
      const secondInstallationTypeResponse = await createInstallationType(
        secondInstallationType,
      );

      let createdSchemaId: number | undefined;

      try {
        // Create a schema with the same name but different installation type
        const duplicateNameSchema = {
          ...testInstallationSchema,
          installationTypeId: secondInstallationTypeResponse.id,
          description: 'Schema with same name but different installation type',
        };

        const response = await createInstallationSchema(duplicateNameSchema);

        // Should succeed because it's a different installation type
        expect(response).toBeDefined();
        expect(response.name).toBe(testInstallationSchema.name);
        expect(response.installationTypeId).toBe(
          secondInstallationTypeResponse.id,
        );

        // Store the ID for manual cleanup
        createdSchemaId = response.id;
      } finally {
        // Clean up in correct order: schema first, then installation type
        if (createdSchemaId) {
          try {
            await installationSchemaRepository.delete(createdSchemaId);
          } catch (error) {
            console.log('Error cleaning up schema:', error);
          }
        }

        // Now clean up the second installation type
        try {
          await deleteInstallationType({
            id: secondInstallationTypeResponse.id,
          });
        } catch (error) {
          console.log('Error cleaning up installation type:', error);
        }
      }
    });

    test('should handle validation errors for invalid installation type', async () => {
      const invalidPayload = {
        ...testInstallationSchema,
        name: 'different_name',
        installationTypeId: 9999, // Non-existent installation type
      };

      await expect(createInstallationSchema(invalidPayload)).rejects.toThrow();

      // Validate specific error code
      let validationError: FieldValidationError | undefined;
      try {
        await createInstallationSchema(invalidPayload);
      } catch (error) {
        validationError = error as FieldValidationError;
      }

      expect(validationError).toBeDefined();
      expect(validationError?.name).toBe('FieldValidationError');
      expect(validationError?.fieldErrors).toBeDefined();
      expect(validationError?.fieldErrors[0].field).toBe('installationTypeId');
      expect(validationError?.fieldErrors[0].code).toBe('NOT_FOUND');
    });

    test('should handle update validation errors', async () => {
      await expect(
        updateInstallationSchema({
          id: createdInstallationSchemaId,
          installationTypeId: 9999, // Non-existent installation type
        }),
      ).rejects.toThrow();
    });

    test('should validate enum type requires enumValues', async () => {
      // Test enum without options should fail
      const enumWithoutOptionsPayload = {
        name: 'invalid_enum',
        type: InstallationSchemaFieldType.ENUM,
        // Missing options entirely
        installationTypeId: createdInstallationTypeId,
      };

      await expect(
        createInstallationSchema(enumWithoutOptionsPayload),
      ).rejects.toThrow();

      // Validate specific error code for missing options
      let validationError: FieldValidationError | undefined;
      try {
        await createInstallationSchema(enumWithoutOptionsPayload);
      } catch (error) {
        validationError = error as FieldValidationError;
      }

      expect(validationError).toBeDefined();
      expect(validationError?.name).toBe('FieldValidationError');
      expect(validationError?.fieldErrors).toBeDefined();
      expect(validationError?.fieldErrors[0].field).toBe('options');
      expect(validationError?.fieldErrors[0].code).toBe('INVALID_ENUM_OPTIONS');

      // Test enum with empty enumValues
      await expect(
        createInstallationSchema({
          name: 'empty_enum',
          type: InstallationSchemaFieldType.ENUM,
          options: {
            enumValues: [], // Empty array
          },
          installationTypeId: createdInstallationTypeId,
        }),
      ).rejects.toThrow();

      // Test enum with invalid values
      await expect(
        createInstallationSchema({
          name: 'invalid_enum_values',
          type: InstallationSchemaFieldType.ENUM,
          options: {
            enumValues: ['valid', '', '  '], // Contains empty/whitespace strings
          },
          installationTypeId: createdInstallationTypeId,
        }),
      ).rejects.toThrow();
    });

    test('should validate that non-enum types cannot have options', async () => {
      // Test string type with options should fail
      const stringWithOptionsPayload = {
        name: 'string_with_options',
        type: InstallationSchemaFieldType.STRING,
        options: {
          enumValues: ['invalid'],
        },
        installationTypeId: createdInstallationTypeId,
      };

      await expect(
        createInstallationSchema(stringWithOptionsPayload),
      ).rejects.toThrow();

      // Validate specific error code
      let validationError: FieldValidationError | undefined;
      try {
        await createInstallationSchema(stringWithOptionsPayload);
      } catch (error) {
        validationError = error as FieldValidationError;
      }

      expect(validationError).toBeDefined();
      expect(validationError?.name).toBe('FieldValidationError');
      expect(validationError?.fieldErrors).toBeDefined();
      expect(validationError?.fieldErrors[0].field).toBe('options');
      expect(validationError?.fieldErrors[0].code).toBe(
        'INVALID_OPTIONS_FOR_TYPE',
      );

      // Date type with options should fail
      await expect(
        createInstallationSchema({
          name: 'date_with_options',
          type: InstallationSchemaFieldType.DATE,
          options: {
            enumValues: ['invalid'],
          },
          installationTypeId: createdInstallationTypeId,
        }),
      ).rejects.toThrow();

      // Long text type with options should fail
      await expect(
        createInstallationSchema({
          name: 'long_text_with_options',
          type: InstallationSchemaFieldType.LONG_TEXT,
          options: {
            enumValues: ['invalid'],
          },
          installationTypeId: createdInstallationTypeId,
        }),
      ).rejects.toThrow();

      // Number type with options should fail
      await expect(
        createInstallationSchema({
          name: 'number_with_options',
          type: InstallationSchemaFieldType.NUMBER,
          options: {
            enumValues: ['invalid'],
          },
          installationTypeId: createdInstallationTypeId,
        }),
      ).rejects.toThrow();

      // Boolean type with options should fail
      await expect(
        createInstallationSchema({
          name: 'boolean_with_options',
          type: InstallationSchemaFieldType.BOOLEAN,
          options: {
            enumValues: ['invalid'],
          },
          installationTypeId: createdInstallationTypeId,
        }),
      ).rejects.toThrow();
    });

    test('should create valid schemas with correct field type options', async () => {
      // Valid enum schema (only type that should use options)
      const enumSchema = {
        name: 'valid_enum',
        description: 'Size selection enum field',
        type: InstallationSchemaFieldType.ENUM,
        options: {
          enumValues: ['small', 'medium', 'large'],
        },
        required: true,
        installationTypeId: createdInstallationTypeId,
      };

      const enumResponse = await createInstallationSchema(enumSchema);
      schemaCleanup.track(enumResponse.id);
      expect(enumResponse.type).toBe(InstallationSchemaFieldType.ENUM);
      expect(enumResponse.options.enumValues).toEqual([
        'small',
        'medium',
        'large',
      ]);

      // Valid string schema (no options)
      const stringSchema = {
        name: 'valid_string',
        description: 'A simple text field',
        type: InstallationSchemaFieldType.STRING,
        required: false,
        installationTypeId: createdInstallationTypeId,
      };

      const stringResponse = await createInstallationSchema(stringSchema);
      schemaCleanup.track(stringResponse.id);
      expect(stringResponse.type).toBe(InstallationSchemaFieldType.STRING);

      // Valid long text schema (no options)
      const longTextSchema = {
        name: 'valid_long_text',
        description: 'A field for longer text content',
        type: InstallationSchemaFieldType.LONG_TEXT,
        required: false,
        installationTypeId: createdInstallationTypeId,
      };

      const longTextResponse = await createInstallationSchema(longTextSchema);
      schemaCleanup.track(longTextResponse.id);
      expect(longTextResponse.type).toBe(InstallationSchemaFieldType.LONG_TEXT);

      // Valid boolean schema (no options)
      const booleanSchema = {
        name: 'valid_boolean',
        description: 'A true/false field',
        type: InstallationSchemaFieldType.BOOLEAN,
        required: false,
        installationTypeId: createdInstallationTypeId,
      };

      const booleanResponse = await createInstallationSchema(booleanSchema);
      schemaCleanup.track(booleanResponse.id);
      expect(booleanResponse.type).toBe(InstallationSchemaFieldType.BOOLEAN);
    });
  });
});
