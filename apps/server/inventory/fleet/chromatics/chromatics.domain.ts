import { FieldErrorCollector } from '@repo/base-repo';
import { standardFieldErrors } from '@/shared/errors';
import { chromatics } from './chromatics.schema';
import type {
  CreateChromaticPayload,
  UpdateChromaticPayload,
} from './chromatics.types';
import { chromaticsRepository } from './chromatics.repository';

/**
 * Validates uniqueness constraints for chromatic data
 * Ensures that chromatic names are unique (excluding soft-deleted records)
 */
async function validateChromaticUniqueness(
  payload: CreateChromaticPayload | UpdateChromaticPayload,
  currentId?: number,
  validator?: FieldErrorCollector,
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  // Prepare fields to check for uniqueness
  const fieldsToCheck = [];

  if (payload.name) {
    fieldsToCheck.push({
      field: chromatics.name,
      value: payload.name,
    });
  }

  // If no fields to check, return early
  if (fieldsToCheck.length === 0) {
    return collector;
  }

  // Check all fields for uniqueness in a single database query
  const conflicts = await chromaticsRepository.checkUniqueness(
    fieldsToCheck,
    currentId,
  );

  // Add errors for each conflict found
  for (const conflict of conflicts) {
    const error = standardFieldErrors.duplicate(
      'Chromatic',
      conflict.field,
      conflict.value as string,
    );
    collector.addError(error.field, error.code, error.message, error.value);
  }

  return collector;
}

/**
 * Validates chromatic data according to business rules
 * @throws {FieldValidationError} If there are validation violations
 */
async function validateChromatic(
  payload: CreateChromaticPayload | UpdateChromaticPayload,
  currentId?: number,
): Promise<void> {
  const validator = await validateChromaticUniqueness(payload, currentId);
  validator.throwIfErrors();
}

/**
 * Creates domain functions for managing chromatic business logic
 */
export function createChromaticDomain() {
  return {
    validateChromatic,
    validateChromaticUniqueness,
  };
}

// Export the domain instance
export const chromaticDomain = createChromaticDomain();
