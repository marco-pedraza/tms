import { FieldErrorCollector } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { NotFoundError } from '@/shared/errors';
import { installationSchemaRepository } from '@/inventory/locations/installation-schemas/installation-schemas.repository';
import { InstallationPropertyResponse } from '@/inventory/locations/installations/installations.types';
import {
  InstallationProperty,
  PropertyInput,
  PropertyWithSchema,
  UpsertInstallationPropertiesPayload,
} from './installation-properties.types';
import { installationPropertyRepository } from './installation-properties.repository';
import { validateAndCastPropertyValue } from './installation-properties.domain';
import { castPropertyValueForResponse } from './installation-properties.domain';

export function createInstallationPropertyUseCases() {
  /**
   * Helper function to get existing properties and create a map by schema ID
   */
  async function getExistingPropertiesMap(installationId: number) {
    const existingProperties = await installationPropertyRepository.findAll({
      filters: { installationId },
    });

    const propertiesMap = new Map<number, InstallationProperty>();
    existingProperties.forEach((prop) => {
      propertiesMap.set(prop.installationSchemaId, prop);
    });

    return { existingProperties, propertiesMap };
  }

  /**
   * Helper function to create property payload for update operations
   */
  function createUpdatePropertyPayload(property: PropertyWithSchema) {
    return {
      value: property.value,
    };
  }

  /**
   * Helper function to create property payload for create operations
   */
  function createCreatePropertyPayload(
    property: PropertyWithSchema,
    installationId: number,
  ) {
    return {
      value: property.value,
      installationId,
      installationSchemaId: property.schema.id,
    };
  }

  async function validateAndTransformProperties(
    properties: PropertyInput[],
    installationTypeId: number,
  ): Promise<PropertyWithSchema[]> {
    // Get all schemas for this installation type
    const schemas =
      await installationSchemaRepository.findByInstallationTypeId(
        installationTypeId,
      );

    // Create field error collector for accumulating validation errors
    const collector = new FieldErrorCollector();

    // Create PropertyWithSchema objects and validate each property
    const propertiesWithSchemas = properties.map((property) => {
      const schema = schemas.find((schema) => schema.name === property.name);
      if (!schema) {
        throw new NotFoundError(`Schema with name ${property.name} not found`);
      }

      // Validate and cast the property value
      const validatedValue = validateAndCastPropertyValue(
        property.name,
        property.value,
        {
          type: schema.type,
          required: schema.required,
          options: schema.options,
        },
        collector,
      );

      return {
        name: property.name,
        value: validatedValue,
        schema: {
          id: schema.id,
          name: schema.name,
          label: schema.label,
          type: schema.type,
          required: schema.required,
          options: schema.options,
        },
      };
    });

    // Throw if there are any validation errors
    collector.throwIfErrors();

    return propertiesWithSchemas;
  }

  async function upsertInstallationProperties(
    payload: UpsertInstallationPropertiesPayload,
  ): Promise<InstallationProperty[]> {
    const { installationId, properties } = payload;

    return await db.transaction(async (tx) => {
      // Create transaction-scoped repository
      const txRepository = installationPropertyRepository.withTransaction(tx);

      // Get existing properties using transaction-scoped repository
      const existingProperties = await txRepository.findAll({
        filters: { installationId },
      });

      const propertiesMap = new Map<number, InstallationProperty>();
      existingProperties.forEach((prop) => {
        propertiesMap.set(prop.installationSchemaId, prop);
      });

      const results: InstallationProperty[] = [];

      for (const property of properties) {
        const existing = propertiesMap.get(property.schema.id);

        if (existing) {
          // Update existing property using transaction-scoped repository
          const updated = await txRepository.update(
            existing.id,
            createUpdatePropertyPayload(property),
          );
          results.push(updated);
        } else {
          // Create new property using transaction-scoped repository
          const created = await txRepository.create(
            createCreatePropertyPayload(property, installationId),
          );
          results.push(created);
        }
      }

      return results;
    });
  }

  /**
   * Gets all properties for an installation with their schemas and casted values for API response
   * This combines all schema definitions with actual property values (if they exist)
   * @param installationTypeId - The installation type ID to get schemas for
   * @param installationId - The installation ID to get property values for
   * @returns Array of properties with schemas and casted values
   */
  async function getInstallationPropertiesForResponse(
    installationTypeId: number | null,
    installationId: number,
  ): Promise<InstallationPropertyResponse[]> {
    if (!installationTypeId) {
      return [];
    }

    // Get schemas and existing properties
    const [schemas, { propertiesMap }] = await Promise.all([
      installationSchemaRepository.findByInstallationTypeId(installationTypeId),
      getExistingPropertiesMap(installationId),
    ]);

    // Build response array with all schemas, including those without values
    const response: InstallationPropertyResponse[] = schemas.map((schema) => {
      const existingProperty = propertiesMap.get(schema.id);

      // Cast the value to appropriate type for API response
      const castedValue = existingProperty
        ? castPropertyValueForResponse(existingProperty.value, schema.type)
        : null;

      return {
        id: existingProperty?.id ?? null,
        name: schema.name,
        label: schema.label,
        description: schema.description,
        type: schema.type,
        value: castedValue,
        required: schema.required,
        options: schema.options,
        schemaId: schema.id,
      };
    });

    return response;
  }

  return {
    validateAndTransformProperties,
    upsertInstallationProperties,
    getInstallationPropertiesForResponse,
  };
}

export const installationPropertyUseCases =
  createInstallationPropertyUseCases();
