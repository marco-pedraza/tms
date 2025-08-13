import { FieldErrorCollector } from '@repo/base-repo';
import { standardFieldErrors } from '@/shared/errors';
import { installationTypeRepository } from '@/inventory/locations/installation-types/installation-types.repository';
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
      BATCH_VALIDATION_ERRORS.INSTALLATION_TYPE_NOT_FOUND,
      BATCH_VALIDATION_MESSAGES.INSTALLATION_TYPE_NOT_FOUND(
        payload.installationTypeId ?? 0,
      ),
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
      BATCH_VALIDATION_ERRORS.INVALID_ENUM_OPTIONS,
      BATCH_VALIDATION_MESSAGES.INVALID_ENUM_OPTIONS,
      options,
    );
    return;
  }

  if (options.enumValues.length === 0) {
    collector.addError(
      'options',
      BATCH_VALIDATION_ERRORS.EMPTY_ENUM_OPTIONS,
      BATCH_VALIDATION_MESSAGES.EMPTY_ENUM_OPTIONS,
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
      BATCH_VALIDATION_ERRORS.INVALID_ENUM_VALUES,
      BATCH_VALIDATION_MESSAGES.INVALID_ENUM_VALUES,
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
      BATCH_VALIDATION_ERRORS.INVALID_OPTIONS_FOR_TYPE,
      BATCH_VALIDATION_MESSAGES.INVALID_OPTIONS_FOR_TYPE(fieldType),
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
        BATCH_VALIDATION_ERRORS.UNSUPPORTED_FIELD_TYPE,
        BATCH_VALIDATION_MESSAGES.UNSUPPORTED_FIELD_TYPE(type),
        type,
      );
  }

  return collector;
}

// TODO: Convert these error codes to an enum in the future for better type safety
const BATCH_VALIDATION_ERRORS = {
  INSTALLATION_TYPE_NOT_FOUND: 'NOT_FOUND',
  INVALID_ENUM_OPTIONS: 'INVALID_ENUM_OPTIONS',
  EMPTY_ENUM_OPTIONS: 'EMPTY_ENUM_OPTIONS',
  INVALID_ENUM_VALUES: 'INVALID_ENUM_VALUES',
  INVALID_OPTIONS_FOR_TYPE: 'INVALID_OPTIONS_FOR_TYPE',
  UNSUPPORTED_FIELD_TYPE: 'UNSUPPORTED_FIELD_TYPE',
  DUPLICATE_NAME_IN_BATCH: 'DUPLICATE_NAME_IN_BATCH',
} as const;

const BATCH_VALIDATION_MESSAGES = {
  INSTALLATION_TYPE_NOT_FOUND: (id: number) =>
    `Installation type with id ${id} not found`,
  INVALID_ENUM_OPTIONS: 'Enum type must have enumValues array in options',
  EMPTY_ENUM_OPTIONS: 'Enum type must have at least one option in enumValues',
  INVALID_ENUM_VALUES: 'All enum values must be non-empty strings',
  INVALID_OPTIONS_FOR_TYPE: (fieldType: string) =>
    `${fieldType} type should not have options`,
  UNSUPPORTED_FIELD_TYPE: (type: string) =>
    `Unsupported field type: ${type}. Supported types are: string, long_text, number, boolean, date, enum`,
  DUPLICATE_NAME_IN_BATCH: (name: string) =>
    `Duplicate name '${name}' found in batch. Names must be unique within the same installation type.`,
} as const;

/**
 * Validates multiple installation schemas efficiently in batch
 * @param schemas - Array of schemas to validate with their context
 * @param installationTypeId - The installation type ID for all schemas
 * @throws {FieldValidationError} If there are validation violations
 */
export async function validateInstallationSchemasBatch(
  schemas: {
    payload: CreateInstallationSchemaPayload | UpdateInstallationSchemaPayload;
    currentId?: number;
    index: number; // For error reporting
  }[],
  installationTypeId: number,
): Promise<void> {
  const collector = new FieldErrorCollector();

  // 1. Validate installation type exists (only once)
  await validateInstallationSchemaRelations(
    { installationTypeId } as CreateInstallationSchemaPayload,
    collector,
  );

  // 2. Validate field types for all schemas
  for (const { payload, index } of schemas) {
    const fieldTypeValidator = validateInstallationSchemaFieldType(payload);

    // Add errors with schema index context
    for (const error of fieldTypeValidator.getErrors()) {
      collector.addError(
        `schemas[${index}].${error.field}`,
        error.code,
        error.message,
        error.value,
      );
    }
  }

  // 3. Check for duplicate names within the batch
  const nameMap = new Map<string, number[]>();
  for (const { payload, index } of schemas) {
    if (payload.name) {
      const name = payload.name;
      if (!nameMap.has(name)) {
        nameMap.set(name, []);
      }
      nameMap.get(name)?.push(index);
    }
  }

  // Add errors for duplicate names within the batch
  for (const [name, indices] of nameMap) {
    if (indices.length > 1) {
      for (const index of indices) {
        collector.addError(
          `schemas[${index}].name`,
          BATCH_VALIDATION_ERRORS.DUPLICATE_NAME_IN_BATCH,
          BATCH_VALIDATION_MESSAGES.DUPLICATE_NAME_IN_BATCH(name),
          name,
        );
      }
    }
  }

  // 4. Check uniqueness against database for each schema individually
  for (const { payload, currentId, index } of schemas) {
    if (payload.name) {
      const fieldsToCheck = [
        {
          field: installationSchemas.name,
          value: payload.name,
          scope: {
            field: installationSchemas.installationTypeId,
            value: installationTypeId,
          },
        },
      ];

      // Check uniqueness for this specific name and currentId
      const conflicts = await installationSchemaRepository.checkUniqueness(
        fieldsToCheck,
        currentId,
      );

      // Add database conflicts with proper schema index context
      for (const conflict of conflicts) {
        const error = standardFieldErrors.duplicate(
          'InstallationSchema',
          conflict.field,
          conflict.value as string,
        );
        collector.addError(
          `schemas[${index}].${error.field}`,
          error.code,
          error.message,
          error.value,
        );
      }
    }
  }

  // Throw all errors at once
  collector.throwIfErrors();
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
