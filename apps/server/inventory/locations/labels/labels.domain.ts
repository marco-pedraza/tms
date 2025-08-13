import { FieldErrorCollector } from '@repo/base-repo';
import { standardFieldErrors } from '@/shared/errors';
import { labels } from './labels.schema';
import type { CreateLabelPayload, UpdateLabelPayload } from './labels.types';
import { labelRepository } from './labels.repository';

/**
 * Validate uniqueness constraints for label data
 * @param payload - Label data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @param validator - Optional validator to reuse (for combining validations)
 * @returns The validator instance for chaining
 */
export async function validateLabelUniqueness(
  payload: CreateLabelPayload | UpdateLabelPayload,
  currentId?: number,
  validator?: FieldErrorCollector,
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  // Prepare fields to check for uniqueness
  const fieldsToCheck = [];

  if (payload.name) {
    fieldsToCheck.push({
      field: labels.name,
      value: payload.name,
    });
  }

  // If no fields to check, return early
  if (fieldsToCheck.length === 0) {
    return collector;
  }

  // Check all fields for uniqueness in a single database query
  const conflicts = await labelRepository.checkUniqueness(
    fieldsToCheck,
    currentId,
  );

  // Add errors for each conflict found
  for (const conflict of conflicts) {
    const error = standardFieldErrors.duplicate(
      'Label',
      conflict.field,
      conflict.value as string,
    );
    collector.addError(error.field, error.code, error.message, error.value);
  }

  return collector;
}

/**
 * Main validation function that combines all business rules and uniqueness checks
 * @param payload - Label data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @throws {FieldValidationError} If validation fails
 */
export async function validateLabel(
  payload: CreateLabelPayload | UpdateLabelPayload,
  currentId?: number,
): Promise<void> {
  const validator = await validateLabelUniqueness(payload, currentId);
  validator.throwIfErrors();
}
