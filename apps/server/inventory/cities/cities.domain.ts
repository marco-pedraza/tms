import { FieldErrorCollector } from '@repo/base-repo';
import { standardFieldErrors } from '../../shared/errors';
import { cities } from './cities.schema';
import type { CreateCityPayload, UpdateCityPayload } from './cities.types';
import { cityRepository } from './cities.repository';

const ENTITY_NAME = 'City';

/**
 * Validate uniqueness constraints for city data
 * @param payload - City data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @param validator - Optional validator to reuse (for combining validations)
 * @returns The validator instance for chaining
 */
export async function validateCityUniqueness(
  payload: CreateCityPayload | UpdateCityPayload,
  currentId?: number,
  validator?: FieldErrorCollector,
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  // Prepare fields to check for uniqueness
  const fieldsToCheck = [];

  if (payload.name) {
    fieldsToCheck.push({
      field: cities.name,
      value: payload.name,
    });
  }

  // If no fields to check, return early
  if (fieldsToCheck.length === 0) {
    return collector;
  }

  // Check all fields for uniqueness in a single database query
  const conflicts = await cityRepository.checkUniqueness(
    fieldsToCheck,
    currentId,
  );

  // Add errors for each conflict found
  for (const conflict of conflicts) {
    const error = standardFieldErrors.duplicate(
      ENTITY_NAME,
      conflict.field,
      conflict.value as string,
    );
    collector.addError(error.field, error.code, error.message, error.value);
  }

  return collector;
}

/**
 * Validates city data according to business rules
 * @param payload - City data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @throws {FieldValidationError} If there are validation violations
 */
export async function validateCity(
  payload: CreateCityPayload | UpdateCityPayload,
  currentId?: number,
): Promise<void> {
  const validator = await validateCityUniqueness(payload, currentId);
  validator.throwIfErrors();
}
