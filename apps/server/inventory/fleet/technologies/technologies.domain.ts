import { FieldErrorCollector } from '@repo/base-repo';
import { standardFieldErrors } from '@/shared/errors';
import { technologies } from './technologies.schema';
import type {
  CreateTechnologyPayload,
  UpdateTechnologyPayload,
} from './technologies.types';
import { technologiesRepository } from './technologies.repository';

/**
 * Validates uniqueness constraints for technology data
 * Ensures that technology names are unique (excluding soft-deleted records)
 */
async function validateTechnologyUniqueness(
  payload: CreateTechnologyPayload | UpdateTechnologyPayload,
  currentId?: number,
  validator?: FieldErrorCollector,
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  // Prepare fields to check for uniqueness
  const fieldsToCheck = [];

  if (payload.name) {
    fieldsToCheck.push({
      field: technologies.name,
      value: payload.name,
    });
  }

  // If no fields to check, return early
  if (fieldsToCheck.length === 0) {
    return collector;
  }

  // Check all fields for uniqueness in a single database query
  const conflicts = await technologiesRepository.checkUniqueness(
    fieldsToCheck,
    currentId,
  );

  // Add errors for each conflict found
  for (const conflict of conflicts) {
    const error = standardFieldErrors.duplicate(
      'Technology',
      conflict.field,
      conflict.value as string,
    );
    collector.addError(error.field, error.code, error.message, error.value);
  }

  return collector;
}

/**
 * Validates technology data according to business rules
 * @throws {FieldValidationError} If there are validation violations
 */
async function validateTechnology(
  payload: CreateTechnologyPayload | UpdateTechnologyPayload,
  currentId?: number,
): Promise<void> {
  const validator = await validateTechnologyUniqueness(payload, currentId);
  validator.throwIfErrors();
}

/**
 * Creates domain functions for managing technology business logic
 */
export function createTechnologyDomain() {
  return {
    validateTechnology,
    validateTechnologyUniqueness,
  };
}

// Export the domain instance
export const technologyDomain = createTechnologyDomain();
