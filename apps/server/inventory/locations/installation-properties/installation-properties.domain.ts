import { FieldErrorCollector } from '@repo/base-repo';
import { InstallationSchemaFieldType } from '@/inventory/locations/installation-schemas/installation-schemas.types';
import { InstallationSchemaOptions } from '@/inventory/locations/installation-schemas/installation-schemas.types';

// Property validation error messages
const PROPERTY_VALIDATION_ERRORS = {
  REQUIRED_FIELD: (fieldName: string) => `${fieldName} is required`,
  INVALID_NUMBER: (value: string) => `"${value}" is not a valid number`,
  INVALID_BOOLEAN: (value: string) =>
    `"${value}" is not a valid boolean. Use "true", "false", "1", or "0"`,
  INVALID_DATE: (value: string) =>
    `"${value}" is not a valid date. Use YYYY-MM-DD format`,
  INVALID_ENUM_VALUE: (value: string, options: string[]) =>
    `"${value}" is not a valid option. Valid options are: ${options.join(', ')}`,
};

/**
 * Validates if a value is required and present
 */
function validateRequiredField(
  propertyName: string,
  value: string,
  isRequired: boolean,
  collector: FieldErrorCollector,
): void {
  if (isRequired && (!value || value.trim() === '')) {
    collector.addError(
      propertyName,
      'REQUIRED',
      PROPERTY_VALIDATION_ERRORS.REQUIRED_FIELD(propertyName),
      value,
    );
  }
}

/**
 * Validates and casts a string value (no additional validation needed)
 */
function validateStringValue(
  propertyName: string,
  value: string,
  // Collector parameter kept for consistency with other validation functions
  // String values don't require additional validation beyond required field check
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  collector: FieldErrorCollector,
): string {
  // String values don't need casting, just return as-is
  return value;
}

/**
 * Validates and casts a number value
 */
function validateNumberValue(
  propertyName: string,
  value: string,
  collector: FieldErrorCollector,
): string {
  if (value.trim() === '') {
    return value; // Empty values are handled by required validation
  }

  const numericValue = Number(value);
  if (isNaN(numericValue)) {
    collector.addError(
      propertyName,
      'INVALID_NUMBER',
      PROPERTY_VALIDATION_ERRORS.INVALID_NUMBER(value),
      value,
    );
    return value; // Return original value on error
  }

  // Return the validated string (we keep everything as strings)
  return value;
}

/**
 * Validates and casts a boolean value
 */
function validateBooleanValue(
  propertyName: string,
  value: string,
  collector: FieldErrorCollector,
): string {
  if (value.trim() === '') {
    return value; // Empty values are handled by required validation
  }

  const lowerValue = value.toLowerCase();
  if (['true', 'false', '1', '0'].includes(lowerValue)) {
    // Normalize to "true" or "false"
    return lowerValue === 'true' || lowerValue === '1' ? 'true' : 'false';
  }

  collector.addError(
    propertyName,
    'INVALID_BOOLEAN',
    PROPERTY_VALIDATION_ERRORS.INVALID_BOOLEAN(value),
    value,
  );
  return value; // Return original value on error
}

/**
 * Validates a date value in YYYY-MM-DD format
 */
function validateDateValue(
  propertyName: string,
  value: string,
  collector: FieldErrorCollector,
): string {
  if (value.trim() === '') {
    return value; // Empty values are handled by required validation
  }

  // Check format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(value)) {
    collector.addError(
      propertyName,
      'INVALID_DATE',
      PROPERTY_VALIDATION_ERRORS.INVALID_DATE(value),
      value,
    );
    return value; // Return original value on error
  }

  // Parse date parts from the input string
  const [yearStr, monthStr, dayStr] = value.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  // Create date using UTC to avoid timezone issues
  const date = new Date(Date.UTC(year, month - 1, day));

  // Validate that it's a real date by comparing the constructed date back to input
  if (
    isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    collector.addError(
      propertyName,
      'INVALID_DATE',
      PROPERTY_VALIDATION_ERRORS.INVALID_DATE(value),
      value,
    );
    return value; // Return original value on error
  }

  return value;
}

/**
 * Validates an enum value against allowed options
 */
function validateEnumValue(
  propertyName: string,
  value: string,
  options: InstallationSchemaOptions,
  collector: FieldErrorCollector,
): string {
  if (value.trim() === '') {
    return value; // Empty values are handled by required validation
  }

  if (!options.enumValues || !Array.isArray(options.enumValues)) {
    collector.addError(
      propertyName,
      'INVALID_ENUM_SCHEMA',
      'Enum schema is invalid - no enumValues defined',
      value,
    );
    return value;
  }

  if (!options.enumValues.includes(value)) {
    collector.addError(
      propertyName,
      'INVALID_ENUM_VALUE',
      PROPERTY_VALIDATION_ERRORS.INVALID_ENUM_VALUE(value, options.enumValues),
      value,
    );
    return value; // Return original value on error
  }

  return value;
}

/**
 * Validates and casts a single property value based on its schema
 * @param propertyName - Name of the property
 * @param value - Raw string value to validate
 * @param schema - Schema definition for the property
 * @param collector - Field error collector for accumulating errors
 * @returns The validated and cast value as string
 */
export function validateAndCastPropertyValue(
  propertyName: string,
  value: string,
  schema: {
    type: string;
    required: boolean;
    options: InstallationSchemaOptions;
  },
  collector: FieldErrorCollector,
): string {
  // First validate if required
  validateRequiredField(propertyName, value, schema.required, collector);

  // If value is empty and not required, return as-is
  if (!value || value.trim() === '') {
    return value;
  }

  // Validate and cast based on type
  switch (schema.type) {
    case 'string':
    case 'long_text':
      return validateStringValue(propertyName, value, collector);

    case 'number':
      return validateNumberValue(propertyName, value, collector);

    case 'boolean':
      return validateBooleanValue(propertyName, value, collector);

    case 'date':
      return validateDateValue(propertyName, value, collector);

    case 'enum':
      return validateEnumValue(propertyName, value, schema.options, collector);

    default:
      collector.addError(
        propertyName,
        'UNSUPPORTED_TYPE',
        `Unsupported field type: ${schema.type}`,
        value,
      );
      return value;
  }
}

/**
 * Casts a property value from string (database storage) to its appropriate type for API response
 * @param value - The string value from database (or null)
 * @param type - The schema field type to cast to
 * @returns The value casted to the appropriate type
 */
export function castPropertyValueForResponse(
  value: string | null,
  type: InstallationSchemaFieldType,
): string | number | boolean | null {
  // Return null if value is null or empty
  if (value === null || value === '') {
    return null;
  }

  switch (type) {
    case 'string':
    case 'long_text':
    case 'date':
      // Keep as string - dates are returned in YYYY-MM-DD format
      return value;

    case 'number': {
      // Cast to number
      const numValue = Number(value);
      return isNaN(numValue) ? null : numValue;
    }

    case 'boolean': {
      // Cast to boolean - handle various string representations
      const lowerValue = value.toLowerCase().trim();
      if (lowerValue === 'true' || lowerValue === '1') {
        return true;
      }
      if (lowerValue === 'false' || lowerValue === '0') {
        return false;
      }
      // For any other value, return null (invalid boolean)
      return null;
    }

    case 'enum':
      // Keep as string for enum values
      return value;

    default:
      // For unknown types, return as string
      return value;
  }
}
