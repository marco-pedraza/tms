import { FieldErrorCollector } from '@repo/base-repo';
import { standardFieldErrors } from '../../shared/errors';
import { populations } from './populations.schema';
import type {
  CreatePopulationPayload,
  UpdatePopulationPayload,
} from './populations.types';
import { populationRepository } from './populations.repository';

/**
 * Validate uniqueness constraints for population data
 * @param payload - Population data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @param validator - Optional validator to reuse (for combining validations)
 * @returns The validator instance for chaining
 */
export async function validatePopulationUniqueness(
  payload: CreatePopulationPayload | UpdatePopulationPayload,
  currentId?: number,
  validator?: FieldErrorCollector,
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  // Prepare fields to check for uniqueness
  const fieldsToCheck = [];

  if (payload.code) {
    fieldsToCheck.push({
      field: populations.code,
      value: payload.code,
    });
  }

  // If no fields to check, return early
  if (fieldsToCheck.length === 0) {
    return collector;
  }

  // Check all fields for uniqueness in a single database query
  const conflicts = await populationRepository.checkUniqueness(
    fieldsToCheck,
    currentId,
  );

  // Add errors for each conflict found
  for (const conflict of conflicts) {
    const error = standardFieldErrors.duplicate(
      'Population',
      conflict.field,
      conflict.value as string,
    );
    collector.addError(error.field, error.code, error.message, error.value);
  }

  return collector;
}

/**
 * Validates population data according to business rules
 * @param payload - Population data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @throws {FieldValidationError} If there are validation violations
 */
export async function validatePopulation(
  payload: CreatePopulationPayload | UpdatePopulationPayload,
  currentId?: number,
): Promise<void> {
  const validator = await validatePopulationUniqueness(payload, currentId);
  validator.throwIfErrors();
}
