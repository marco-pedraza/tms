import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { FieldValidationError } from '@repo/base-repo';
import { cityFactory, populationFactory } from '../../tests/factories';
import { getFactoryDb } from '../../tests/factories/factory-utils';
import { createCleanupHelper } from '../../tests/shared/test-utils';
import { cityRepository } from '../cities/cities.repository';
import { db } from '../db-service';
import { createInstallationSchema } from '../installation-schemas/installation-schemas.controller';
import { installationSchemaRepository } from '../installation-schemas/installation-schemas.repository';
import { InstallationSchemaFieldType } from '../installation-schemas/installation-schemas.types';
import {
  createInstallationType,
  deleteInstallationType,
} from '../installation-types/installation-types.controller';
import { createInstallation } from '../installations/installations.controller';
import { installationRepository } from '../installations/installations.repository';
import { createNode } from '../nodes/nodes.controller';
import { nodeRepository } from '../nodes/nodes.repository';
import { populationRepository } from '../populations/populations.repository';
import { installationPropertyRepository } from './installation-properties.repository';
import { installationPropertyUseCases } from './installation-properties.use-cases';

describe('Installation Properties Use Cases', () => {
  const factoryDb = getFactoryDb(db);

  // Test data
  const testInstallationType = {
    name: 'Test Installation Type for Properties',
    code: 'TIT',
    description: 'Test installation type for property validation testing',
  };

  // Variables to store created IDs for cleanup
  let createdInstallationTypeId: number;
  let stringSchemaId: number;
  let numberSchemaId: number;
  let booleanSchemaId: number;
  let dateSchemaId: number;
  let enumSchemaId: number;
  let testInstallationId: number;
  let testCityId: number;
  let testPopulationId: number;
  let testNodeId: number;

  const schemaCleanup = createCleanupHelper(
    ({ id }) => installationSchemaRepository.delete(id),
    'installation schema',
  );

  const installationCleanup = createCleanupHelper(
    ({ id }) => installationRepository.forceDelete(id),
    'installation',
  );

  const nodeCleanup = createCleanupHelper(
    ({ id }) => nodeRepository.forceDelete(id),
    'node',
  );

  const propertyCleanup = createCleanupHelper(
    ({ id }) => installationPropertyRepository.forceDelete(id),
    'installation property',
  );

  beforeAll(async () => {
    // Create test city and population for node creation
    const testCity = await cityFactory(factoryDb).create({
      name: 'Test City for Properties',
      latitude: 19.4326,
      longitude: -99.1332,
      timezone: 'America/Mexico_City',
    });
    testCityId = testCity.id;

    const testPopulation = await populationFactory(factoryDb).create({
      code: 'TPOP',
      description: 'Test population for properties',
      active: true,
    });
    testPopulationId = testPopulation.id;

    // Create test node for installation
    const nodeData = {
      code: 'TN001',
      name: 'Test Node for Properties',
      latitude: 19.4326,
      longitude: -99.1332,
      radius: 1000,
      cityId: testCityId,
      populationId: testPopulationId,
    };
    const createdNode = await createNode(nodeData);
    testNodeId = nodeCleanup.track(createdNode.id);

    // Create installation type for testing
    const installationType = await createInstallationType(testInstallationType);
    createdInstallationTypeId = installationType.id;

    // Create test installation
    const installationData = {
      nodeId: testNodeId,
      name: 'Test Installation for Properties',
      address: 'Test Installation Address',
      description: 'Test installation for property testing',
      installationTypeId: null,
    };
    const createdInstallation = await createInstallation(installationData);
    testInstallationId = installationCleanup.track(createdInstallation.id);

    // Create various schema types for testing
    const stringSchema = await createInstallationSchema({
      name: 'test_string',
      type: InstallationSchemaFieldType.STRING,
      required: false,
      installationTypeId: createdInstallationTypeId,
    });
    stringSchemaId = schemaCleanup.track(stringSchema.id);

    const numberSchema = await createInstallationSchema({
      name: 'test_number',
      type: InstallationSchemaFieldType.NUMBER,
      required: false,
      installationTypeId: createdInstallationTypeId,
    });
    numberSchemaId = schemaCleanup.track(numberSchema.id);

    const booleanSchema = await createInstallationSchema({
      name: 'test_boolean',
      type: InstallationSchemaFieldType.BOOLEAN,
      required: false,
      installationTypeId: createdInstallationTypeId,
    });
    booleanSchemaId = schemaCleanup.track(booleanSchema.id);

    const dateSchema = await createInstallationSchema({
      name: 'test_date',
      type: InstallationSchemaFieldType.DATE,
      required: false,
      installationTypeId: createdInstallationTypeId,
    });
    dateSchemaId = schemaCleanup.track(dateSchema.id);

    const enumSchema = await createInstallationSchema({
      name: 'test_enum',
      type: InstallationSchemaFieldType.ENUM,
      options: {
        enumValues: ['option1', 'option2', 'option3'],
      },
      required: false,
      installationTypeId: createdInstallationTypeId,
    });
    enumSchemaId = schemaCleanup.track(enumSchema.id);

    const requiredStringSchema = await createInstallationSchema({
      name: 'required_string',
      type: InstallationSchemaFieldType.STRING,
      required: true,
      installationTypeId: createdInstallationTypeId,
    });
    schemaCleanup.track(requiredStringSchema.id);
  });

  afterAll(async () => {
    // Clean up all created properties first
    await propertyCleanup.cleanupAll();

    // Clean up all created schemas
    await schemaCleanup.cleanupAll();

    // Clean up nodes first (they reference installations)
    await nodeCleanup.cleanupAll();

    // Then clean up installations
    await installationCleanup.cleanupAll();

    // Clean up factory-created entities
    if (testPopulationId) {
      try {
        await populationRepository.forceDelete(testPopulationId);
      } catch (error) {
        console.log('Error cleaning up test population:', error);
      }
    }
    if (testCityId) {
      try {
        await cityRepository.forceDelete(testCityId);
      } catch (error) {
        console.log('Error cleaning up test city:', error);
      }
    }

    // Clean up installation type
    if (createdInstallationTypeId) {
      try {
        await deleteInstallationType({ id: createdInstallationTypeId });
      } catch (error) {
        console.log('Error cleaning up installation type:', error);
      }
    }
  });

  describe('validateAndTransformProperties', () => {
    describe('success scenarios', () => {
      test('should validate and transform valid properties of different types', async () => {
        const properties = [
          { name: 'test_string', value: 'Hello World' },
          { name: 'test_number', value: '42' },
          { name: 'test_boolean', value: 'true' },
          { name: 'test_date', value: '2024-03-15' },
          { name: 'test_enum', value: 'option2' },
        ];

        const result =
          await installationPropertyUseCases.validateAndTransformProperties(
            properties,
            createdInstallationTypeId,
          );

        expect(result).toBeDefined();
        expect(result.length).toBe(5);

        // Verify string property
        const stringProp = result.find((p) => p.name === 'test_string');
        expect(stringProp).toBeDefined();
        expect(stringProp?.value).toBe('Hello World');
        expect(stringProp?.schema.type).toBe('string');

        // Verify number property
        const numberProp = result.find((p) => p.name === 'test_number');
        expect(numberProp).toBeDefined();
        expect(numberProp?.value).toBe('42');
        expect(numberProp?.schema.type).toBe('number');

        // Verify boolean property (normalized)
        const booleanProp = result.find((p) => p.name === 'test_boolean');
        expect(booleanProp).toBeDefined();
        expect(booleanProp?.value).toBe('true');
        expect(booleanProp?.schema.type).toBe('boolean');

        // Verify date property
        const dateProp = result.find((p) => p.name === 'test_date');
        expect(dateProp).toBeDefined();
        expect(dateProp?.value).toBe('2024-03-15');
        expect(dateProp?.schema.type).toBe('date');

        // Verify enum property
        const enumProp = result.find((p) => p.name === 'test_enum');
        expect(enumProp).toBeDefined();
        expect(enumProp?.value).toBe('option2');
        expect(enumProp?.schema.type).toBe('enum');
      });

      test('should handle empty non-required properties', async () => {
        const properties = [
          { name: 'test_string', value: '' },
          { name: 'test_number', value: '' },
        ];

        const result =
          await installationPropertyUseCases.validateAndTransformProperties(
            properties,
            createdInstallationTypeId,
          );

        expect(result).toBeDefined();
        expect(result.length).toBe(2);
        expect(result[0].value).toBe('');
        expect(result[1].value).toBe('');
      });

      test('should normalize boolean values correctly', async () => {
        const properties = [{ name: 'test_boolean', value: '1' }];

        const result =
          await installationPropertyUseCases.validateAndTransformProperties(
            properties,
            createdInstallationTypeId,
          );

        expect(result).toBeDefined();
        expect(result.length).toBe(1);
        expect(result[0].value).toBe('true'); // '1' should be normalized to 'true'
      });
    });

    describe('error scenarios', () => {
      test('should throw NotFoundError for non-existent schema', async () => {
        const properties = [
          { name: 'non_existent_schema', value: 'some value' },
        ];

        await expect(
          installationPropertyUseCases.validateAndTransformProperties(
            properties,
            createdInstallationTypeId,
          ),
        ).rejects.toThrow('Schema with name non_existent_schema not found');
      });

      test('should throw FieldValidationError for required field missing', async () => {
        const properties = [
          { name: 'required_string', value: '' }, // Required field with empty value
        ];

        await expect(
          installationPropertyUseCases.validateAndTransformProperties(
            properties,
            createdInstallationTypeId,
          ),
        ).rejects.toThrow(FieldValidationError);
      });

      test('should throw FieldValidationError for invalid number', async () => {
        const properties = [{ name: 'test_number', value: 'not a number' }];

        await expect(
          installationPropertyUseCases.validateAndTransformProperties(
            properties,
            createdInstallationTypeId,
          ),
        ).rejects.toThrow(FieldValidationError);
      });

      test('should throw FieldValidationError for invalid boolean', async () => {
        const properties = [{ name: 'test_boolean', value: 'maybe' }];

        await expect(
          installationPropertyUseCases.validateAndTransformProperties(
            properties,
            createdInstallationTypeId,
          ),
        ).rejects.toThrow(FieldValidationError);
      });

      test('should throw FieldValidationError for invalid date format', async () => {
        const properties = [
          { name: 'test_date', value: '15/03/2024' }, // Wrong format
        ];

        await expect(
          installationPropertyUseCases.validateAndTransformProperties(
            properties,
            createdInstallationTypeId,
          ),
        ).rejects.toThrow(FieldValidationError);
      });

      test('should throw FieldValidationError for invalid enum value', async () => {
        const properties = [{ name: 'test_enum', value: 'invalid_option' }];

        await expect(
          installationPropertyUseCases.validateAndTransformProperties(
            properties,
            createdInstallationTypeId,
          ),
        ).rejects.toThrow(FieldValidationError);
      });

      test('should accumulate multiple validation errors', async () => {
        const properties = [
          { name: 'required_string', value: '' }, // Required field missing
          { name: 'test_number', value: 'invalid_number' }, // Invalid number
          { name: 'test_boolean', value: 'maybe' }, // Invalid boolean
        ];

        try {
          await installationPropertyUseCases.validateAndTransformProperties(
            properties,
            createdInstallationTypeId,
          );
          expect(true).toBe(false); // Should not reach here
        } catch (error) {
          expect(error).toBeInstanceOf(FieldValidationError);
          const fieldError = error as FieldValidationError;
          expect(fieldError.fieldErrors.length).toBe(3);

          // Check that all expected errors are present
          const errorFields = fieldError.fieldErrors.map((e) => e.field);
          expect(errorFields).toContain('required_string');
          expect(errorFields).toContain('test_number');
          expect(errorFields).toContain('test_boolean');
        }
      });
    });

    describe('edge cases', () => {
      test('should handle empty properties array', async () => {
        const properties: { name: string; value: string }[] = [];

        const result =
          await installationPropertyUseCases.validateAndTransformProperties(
            properties,
            createdInstallationTypeId,
          );

        expect(result).toBeDefined();
        expect(result.length).toBe(0);
      });

      test('should handle properties with whitespace values', async () => {
        const properties = [
          { name: 'test_string', value: '   ' }, // Only whitespace
        ];

        const result =
          await installationPropertyUseCases.validateAndTransformProperties(
            properties,
            createdInstallationTypeId,
          );

        expect(result).toBeDefined();
        expect(result.length).toBe(1);
        expect(result[0].value).toBe('   '); // Whitespace preserved for non-required fields
      });

      test('should handle case sensitive enum values', async () => {
        const properties = [
          { name: 'test_enum', value: 'Option1' }, // Different case
        ];

        await expect(
          installationPropertyUseCases.validateAndTransformProperties(
            properties,
            createdInstallationTypeId,
          ),
        ).rejects.toThrow(FieldValidationError);
      });
    });

    describe('schema property mapping', () => {
      test('should correctly map schema properties to result', async () => {
        const properties = [{ name: 'test_string', value: 'test value' }];

        const result =
          await installationPropertyUseCases.validateAndTransformProperties(
            properties,
            createdInstallationTypeId,
          );

        expect(result).toBeDefined();
        expect(result.length).toBe(1);

        const property = result[0];
        expect(property.schema).toBeDefined();
        expect(property.schema.id).toBe(stringSchemaId);
        expect(property.schema.name).toBe('test_string');
        expect(property.schema.type).toBe('string');
        expect(property.schema.required).toBe(false);
        expect(property.schema.options).toBeDefined();
      });
    });
  });

  describe('upsertInstallationProperties', () => {
    describe('success scenarios', () => {
      test('should create new properties when none exist', async () => {
        // First validate and transform properties
        const properties = [
          { name: 'test_string', value: 'Hello World' },
          { name: 'test_number', value: '42' },
          { name: 'test_boolean', value: 'true' },
        ];

        const validatedProperties =
          await installationPropertyUseCases.validateAndTransformProperties(
            properties,
            createdInstallationTypeId,
          );

        // Now upsert them
        const result =
          await installationPropertyUseCases.upsertInstallationProperties({
            installationId: testInstallationId,
            properties: validatedProperties,
          });

        expect(result).toBeDefined();
        expect(result.length).toBe(3);

        // Track all created properties for cleanup
        result.forEach((prop) => propertyCleanup.track(prop.id));

        // Verify all properties were created with correct values
        const stringProp = result.find(
          (p) => p.installationSchemaId === stringSchemaId,
        );
        expect(stringProp).toBeDefined();
        expect(stringProp?.value).toBe('Hello World');
        expect(stringProp?.installationId).toBe(testInstallationId);

        const numberProp = result.find(
          (p) => p.installationSchemaId === numberSchemaId,
        );
        expect(numberProp).toBeDefined();
        expect(numberProp?.value).toBe('42');
        expect(numberProp?.installationId).toBe(testInstallationId);

        const booleanProp = result.find(
          (p) => p.installationSchemaId === booleanSchemaId,
        );
        expect(booleanProp).toBeDefined();
        expect(booleanProp?.value).toBe('true');
        expect(booleanProp?.installationId).toBe(testInstallationId);
      });

      test('should update existing properties when they exist', async () => {
        // First create some properties
        const initialProperties = [
          { name: 'test_string', value: 'Initial Value' },
          { name: 'test_number', value: '100' },
        ];

        const initialValidatedProperties =
          await installationPropertyUseCases.validateAndTransformProperties(
            initialProperties,
            createdInstallationTypeId,
          );

        const initialResult =
          await installationPropertyUseCases.upsertInstallationProperties({
            installationId: testInstallationId,
            properties: initialValidatedProperties,
          });

        // Track created properties for cleanup
        initialResult.forEach((prop) => propertyCleanup.track(prop.id));

        // Now update with new values
        const updatedProperties = [
          { name: 'test_string', value: 'Updated Value' },
          { name: 'test_number', value: '200' },
        ];

        const updatedValidatedProperties =
          await installationPropertyUseCases.validateAndTransformProperties(
            updatedProperties,
            createdInstallationTypeId,
          );

        const updateResult =
          await installationPropertyUseCases.upsertInstallationProperties({
            installationId: testInstallationId,
            properties: updatedValidatedProperties,
          });

        expect(updateResult).toBeDefined();
        expect(updateResult.length).toBe(2);

        // Verify properties were updated, not created new
        expect(updateResult[0].id).toBe(initialResult[0].id);
        expect(updateResult[1].id).toBe(initialResult[1].id);

        // Verify values were updated
        const stringProp = updateResult.find(
          (p) => p.installationSchemaId === stringSchemaId,
        );
        expect(stringProp?.value).toBe('Updated Value');

        const numberProp = updateResult.find(
          (p) => p.installationSchemaId === numberSchemaId,
        );
        expect(numberProp?.value).toBe('200');
      });

      test('should handle mixed create and update operations', async () => {
        // First create one property
        const existingProperties = [
          { name: 'test_string', value: 'Existing Value' },
        ];

        const existingValidatedProperties =
          await installationPropertyUseCases.validateAndTransformProperties(
            existingProperties,
            createdInstallationTypeId,
          );

        const existingResult =
          await installationPropertyUseCases.upsertInstallationProperties({
            installationId: testInstallationId,
            properties: existingValidatedProperties,
          });

        propertyCleanup.track(existingResult[0].id);

        // Now upsert with one update and one new property
        const mixedProperties = [
          { name: 'test_string', value: 'Updated Existing Value' }, // Update
          { name: 'test_boolean', value: 'true' }, // Create new
        ];

        const mixedValidatedProperties =
          await installationPropertyUseCases.validateAndTransformProperties(
            mixedProperties,
            createdInstallationTypeId,
          );

        const mixedResult =
          await installationPropertyUseCases.upsertInstallationProperties({
            installationId: testInstallationId,
            properties: mixedValidatedProperties,
          });

        expect(mixedResult).toBeDefined();
        expect(mixedResult.length).toBe(2);

        // Track the new property for cleanup
        const newProperty = mixedResult.find(
          (p) => p.installationSchemaId === booleanSchemaId,
        );
        if (newProperty) {
          propertyCleanup.track(newProperty.id);
        }

        // Verify the existing property was updated (same ID)
        const updatedProperty = mixedResult.find(
          (p) => p.installationSchemaId === stringSchemaId,
        );
        expect(updatedProperty?.id).toBe(existingResult[0].id);
        expect(updatedProperty?.value).toBe('Updated Existing Value');

        // Verify the new property was created (different ID)
        expect(newProperty?.id).not.toBe(existingResult[0].id);
        expect(newProperty?.value).toBe('true');
      });

      test('should handle empty properties array', async () => {
        const result =
          await installationPropertyUseCases.upsertInstallationProperties({
            installationId: testInstallationId,
            properties: [],
          });

        expect(result).toBeDefined();
        expect(result.length).toBe(0);
      });

      test('should preserve schema information in created properties', async () => {
        const properties = [{ name: 'test_string', value: 'Schema Test' }];

        const validatedProperties =
          await installationPropertyUseCases.validateAndTransformProperties(
            properties,
            createdInstallationTypeId,
          );

        const result =
          await installationPropertyUseCases.upsertInstallationProperties({
            installationId: testInstallationId,
            properties: validatedProperties,
          });

        propertyCleanup.track(result[0].id);

        expect(result).toBeDefined();
        expect(result.length).toBe(1);

        const property = result[0];
        // Only validate fields that exist in the optimized schema
        expect(property.value).toBe('Schema Test');
        expect(property.installationSchemaId).toBe(stringSchemaId);
        expect(property.installationId).toBe(testInstallationId);
      });
    });

    describe('performance and optimization', () => {
      test('should efficiently handle multiple properties with single query', async () => {
        // Create multiple properties to test the optimization
        const manyProperties = [
          { name: 'test_string', value: 'String Value' },
          { name: 'test_number', value: '123' },
          { name: 'test_boolean', value: 'false' },
          { name: 'test_date', value: '2024-03-15' },
          { name: 'test_enum', value: 'option1' },
        ];

        const validatedProperties =
          await installationPropertyUseCases.validateAndTransformProperties(
            manyProperties,
            createdInstallationTypeId,
          );

        const result =
          await installationPropertyUseCases.upsertInstallationProperties({
            installationId: testInstallationId,
            properties: validatedProperties,
          });

        // Track all created properties for cleanup
        result.forEach((prop) => propertyCleanup.track(prop.id));

        expect(result).toBeDefined();
        expect(result.length).toBe(5);

        // Verify all properties were created correctly
        expect(
          result.find((p) => p.installationSchemaId === stringSchemaId)?.value,
        ).toBe('String Value');
        expect(
          result.find((p) => p.installationSchemaId === numberSchemaId)?.value,
        ).toBe('123');
        expect(
          result.find((p) => p.installationSchemaId === booleanSchemaId)?.value,
        ).toBe('false');
        expect(
          result.find((p) => p.installationSchemaId === dateSchemaId)?.value,
        ).toBe('2024-03-15');
        expect(
          result.find((p) => p.installationSchemaId === enumSchemaId)?.value,
        ).toBe('option1');
      });
    });
  });
});
