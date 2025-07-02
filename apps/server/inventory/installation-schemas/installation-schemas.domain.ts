import { FieldErrorCollector } from '@repo/base-repo';
import { standardFieldErrors } from '../../shared/errors';
import { installationTypeRepository } from '../installation-types/installation-types.repository';
import { installationSchemas } from './installation-schemas.schema';
import type {
  CreateInstallationSchemaPayload,
  InstallationSchemaOptions,
  UpdateInstallationSchemaPayload,
} from './installation-schemas.types';
import { installationSchemaRepository } from './installation-schemas.repository';

/**
 * Validate uniqueness constraints for installation schema data
 * @param payload - Installation schema data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @param validator - Optional validator to reuse (for combining validations)
 * @returns The validator instance for chaining
 */
export async function validateInstallationSchemaUniqueness(
  payload: CreateInstallationSchemaPayload | UpdateInstallationSchemaPayload,
  currentId?: number,
  validator?: FieldErrorCollector,
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  // Prepare fields to check for uniqueness
  const fieldsToCheck = [];

  // Check name uniqueness if name is provided
  if (payload.name) {
    let installationTypeId = payload.installationTypeId;

    // For updates, if installationTypeId is not provided in payload,
    // fetch it from the existing entity
    if (!installationTypeId && currentId) {
      try {
        const existingEntity =
          await installationSchemaRepository.findOne(currentId);
        installationTypeId = existingEntity.installationTypeId;
      } catch {
        // If entity doesn't exist, validation will fail elsewhere
        // Continue without the uniqueness check
      }
    }

    // Only perform uniqueness check if we have both name and installationTypeId
    if (installationTypeId) {
      // Name should be unique within the same installation type
      fieldsToCheck.push({
        field: installationSchemas.name,
        value: payload.name,
        scope: {
          field: installationSchemas.installationTypeId,
          value: installationTypeId,
        },
      });
    }
  }

  // If no fields to check, return early
  if (fieldsToCheck.length === 0) {
    return collector;
  }

  // Check all fields for uniqueness in a single database query
  const conflicts = await installationSchemaRepository.checkUniqueness(
    fieldsToCheck,
    currentId,
  );

  // Add errors for each conflict found
  for (const conflict of conflicts) {
    const error = standardFieldErrors.duplicate(
      'InstallationSchema',
      conflict.field,
      conflict.value as string,
    );
    collector.addError(error.field, error.code, error.message, error.value);
  }

  return collector;
}

/**
 * Validate related entities exist
 * @param payload - Installation schema data to validate
 * @param validator - Optional validator to reuse (for combining validations)
 * @returns The validator instance for chaining
 */
export async function validateInstallationSchemaRelations(
  payload: CreateInstallationSchemaPayload | UpdateInstallationSchemaPayload,
  validator?: FieldErrorCollector,
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  try {
    // Validate installation type exists
    if (payload.installationTypeId) {
      await installationTypeRepository.findOne(payload.installationTypeId);
    }
  } catch {
    collector.addError(
      'installationTypeId',
      'NOT_FOUND',
      `Installation type with id ${payload.installationTypeId} not found`,
      payload.installationTypeId,
    );
  }

  return collector;
}

/**
 * Validates enum field type options
 */
function validateEnumOptions(
  options: InstallationSchemaOptions | undefined,
  collector: FieldErrorCollector,
): void {
  if (!options?.enumValues || !Array.isArray(options.enumValues)) {
    collector.addError(
      'options',
      'INVALID_ENUM_OPTIONS',
      'Enum type must have enumValues array in options',
      options,
    );
    return;
  }

  if (options.enumValues.length === 0) {
    collector.addError(
      'options',
      'EMPTY_ENUM_OPTIONS',
      'Enum type must have at least one option in enumValues',
      options,
    );
    return;
  }

  const invalidValues = options.enumValues.filter(
    (value: unknown) =>
      typeof value !== 'string' ||
      (typeof value === 'string' && value.trim() === ''),
  );

  if (invalidValues.length > 0) {
    collector.addError(
      'options',
      'INVALID_ENUM_VALUES',
      'All enum values must be non-empty strings',
      invalidValues,
    );
  }
}

/**
 * Validates that non-enum types don't have options
 */
function validateNoOptions(
  options: InstallationSchemaOptions | undefined,
  fieldType: string,
  collector: FieldErrorCollector,
): void {
  if (options) {
    collector.addError(
      'options',
      'INVALID_OPTIONS_FOR_TYPE',
      `${fieldType} type should not have options`,
      options,
    );
  }
}

/**
 * Validate field type specific rules
 * @param payload - Installation schema data to validate
 * @param validator - Optional validator to reuse (for combining validations)
 * @returns The validator instance for chaining
 */
export function validateInstallationSchemaFieldType(
  payload: CreateInstallationSchemaPayload | UpdateInstallationSchemaPayload,
  validator?: FieldErrorCollector,
): FieldErrorCollector {
  const collector = validator || new FieldErrorCollector();

  if (!payload.type) {
    return collector;
  }

  const { type, options } = payload;

  switch (type) {
    case 'enum':
      validateEnumOptions(options, collector);
      break;

    case 'date':
      validateNoOptions(options, 'Date', collector);
      break;

    case 'string':
      validateNoOptions(options, 'String', collector);
      break;

    case 'long_text':
      validateNoOptions(options, 'Long text', collector);
      break;

    case 'number':
      validateNoOptions(options, 'Number', collector);
      break;

    case 'boolean':
      validateNoOptions(options, 'Boolean', collector);
      break;

    default:
      collector.addError(
        'type',
        'UNSUPPORTED_FIELD_TYPE',
        `Unsupported field type: ${type}. Supported types are: string, long_text, number, boolean, date, enum`,
        type,
      );
  }

  return collector;
}

/**
 * Validates installation schema data according to business rules
 * @param payload - Installation schema data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @throws {FieldValidationError} If there are validation violations
 */
export async function validateInstallationSchema(
  payload: CreateInstallationSchemaPayload | UpdateInstallationSchemaPayload,
  currentId?: number,
): Promise<void> {
  let validator = await validateInstallationSchemaUniqueness(
    payload,
    currentId,
  );

  validator = await validateInstallationSchemaRelations(payload, validator);

  validator = validateInstallationSchemaFieldType(payload, validator);

  validator.throwIfErrors();
}
