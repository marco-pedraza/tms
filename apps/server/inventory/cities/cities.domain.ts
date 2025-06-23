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

  if (payload.name) {
    const nameExists = await cityRepository.existsBy(
      cities.name,
      payload.name,
      currentId,
    );
    if (nameExists) {
      const error = standardFieldErrors.duplicate(
        ENTITY_NAME,
        'name',
        payload.name,
      );
      collector.addError(error.field, error.code, error.message, error.value);
    }
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
