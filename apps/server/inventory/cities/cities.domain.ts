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

  // Early return if no validation needed
  const shouldValidate =
    payload.name || (payload.stateId !== undefined && currentId);
  if (!shouldValidate) {
    return collector;
  }

  // Get validation data
  const validationData = await getValidationData(payload, currentId);
  if (!validationData) {
    return collector;
  }

  // Check uniqueness and add errors
  const conflicts = await cityRepository.checkUniqueness(
    [validationData],
    currentId,
  );

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
 * Helper function to get validation data for uniqueness check
 * @param payload - City data to validate
 * @param currentId - ID of the current entity (for updates)
 * @returns Validation data object or null if validation not needed
 */
async function getValidationData(
  payload: CreateCityPayload | UpdateCityPayload,
  currentId?: number,
) {
  let nameToCheck = payload.name;
  let stateId = payload.stateId;

  // Get current city data if needed for updates
  if (currentId) {
    const currentCity = await cityRepository.findOne(currentId);
    nameToCheck = nameToCheck || currentCity.name;
    stateId = stateId !== undefined ? stateId : currentCity.stateId;
  }

  // Return null if we don't have the required data
  if (!nameToCheck || stateId === undefined || stateId === null) {
    return null;
  }

  return {
    field: cities.name,
    value: nameToCheck,
    scope: {
      field: cities.stateId,
      value: stateId,
    },
  };
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
