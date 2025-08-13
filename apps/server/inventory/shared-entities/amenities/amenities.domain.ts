import { FieldErrorCollector } from '@repo/base-repo';
import { standardFieldErrors } from '@/shared/errors';
import { amenities } from './amenities.schema';
import { AmenityCategory, AmenityType } from './amenities.types';
import type {
  CreateAmenityPayload,
  UpdateAmenityPayload,
} from './amenities.types';
import { amenitiesRepository } from './amenities.repository';

/**
 * Validates uniqueness constraints for amenity data
 * Ensures that amenity names are unique (excluding soft-deleted records)
 */
async function validateAmenityUniqueness(
  payload: CreateAmenityPayload | UpdateAmenityPayload,
  currentId?: number,
  validator?: FieldErrorCollector,
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  // Prepare fields to check for uniqueness
  const fieldsToCheck = [];

  if (payload.name) {
    fieldsToCheck.push({
      field: amenities.name,
      value: payload.name,
    });
  }

  // If no fields to check, return early
  if (fieldsToCheck.length === 0) {
    return collector;
  }

  // Check all fields for uniqueness in a single database query
  const conflicts = await amenitiesRepository.checkUniqueness(
    fieldsToCheck,
    currentId,
  );

  // Add errors for each conflict found
  for (const conflict of conflicts) {
    const error = standardFieldErrors.duplicate(
      'Amenity',
      conflict.field,
      conflict.value as string,
    );
    collector.addError(error.field, error.code, error.message, error.value);
  }

  return collector;
}

/**
 * Validates that amenityType is one of the allowed values
 */
function validateAmenityType(
  payload: CreateAmenityPayload | UpdateAmenityPayload,
  validator: FieldErrorCollector,
): void {
  if (payload.amenityType) {
    const allowedTypes = Object.values(AmenityType);
    if (!allowedTypes.includes(payload.amenityType)) {
      validator.addError(
        'amenityType',
        'INVALID_VALUE',
        `Amenity type must be one of: ${allowedTypes.join(', ')}`,
        payload.amenityType,
      );
    }
  }
}

/**
 * Validates that category is one of the allowed values
 */
function validateAmenityCategory(
  payload: CreateAmenityPayload | UpdateAmenityPayload,
  validator: FieldErrorCollector,
): void {
  if (payload.category) {
    const allowedCategories = Object.values(AmenityCategory);
    if (!allowedCategories.includes(payload.category)) {
      validator.addError(
        'category',
        'INVALID_VALUE',
        `Amenity category must be one of: ${allowedCategories.join(', ')}`,
        payload.category,
      );
    }
  }
}

/**
 * Validates that the icon name follows kebab-case format
 * Must be lowercase letters, numbers, and hyphens only
 */
function validateIconName(
  payload: CreateAmenityPayload | UpdateAmenityPayload,
  validator: FieldErrorCollector,
): void {
  if (payload.iconName) {
    // Kebab-case pattern: lowercase letters, numbers, and hyphens only
    // Must start with a letter, no consecutive hyphens, no leading/trailing hyphens
    const kebabCasePattern = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

    if (!kebabCasePattern.test(payload.iconName)) {
      validator.addError(
        'iconName',
        'INVALID_FORMAT',
        'Icon name must be in kebab-case format (lowercase letters, numbers, and hyphens)',
        payload.iconName,
      );
    }
  }
}

/**
 * Validates amenity data according to business rules
 * @throws {FieldValidationError} If there are validation violations
 */
async function validateAmenity(
  payload: CreateAmenityPayload | UpdateAmenityPayload,
  currentId?: number,
): Promise<void> {
  const validator = await validateAmenityUniqueness(payload, currentId);

  // Validate amenity type, category, and icon name
  validateAmenityType(payload, validator);
  validateAmenityCategory(payload, validator);
  validateIconName(payload, validator);

  validator.throwIfErrors();
}

/**
 * Creates domain functions for managing amenity business logic
 */
export function createAmenityDomain() {
  return {
    validateAmenity,
    validateAmenityUniqueness,
  };
}

// Export the domain instance
export const amenityDomain = createAmenityDomain();
