import { FieldErrorCollector } from '@repo/base-repo';
import { standardFieldErrors } from '../../shared/errors';
import { countries } from './countries.schema';
import type {
  CreateCountryPayload,
  UpdateCountryPayload,
} from './countries.types';
import { countryRepository } from './countries.repository';

/**
 * Validate uniqueness constraints for country data
 * @param payload - Country data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @param validator - Optional validator to reuse (for combining validations)
 * @returns The validator instance for chaining
 */
export async function validateCountryUniqueness(
  payload: CreateCountryPayload | UpdateCountryPayload,
  currentId?: number,
  validator?: FieldErrorCollector,
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  // Prepare fields to check for uniqueness
  const fieldsToCheck = [];

  if (payload.code) {
    fieldsToCheck.push({
      field: countries.code,
      value: payload.code,
    });
  }

  if (payload.name) {
    fieldsToCheck.push({
      field: countries.name,
      value: payload.name,
    });
  }

  // If no fields to check, return early
  if (fieldsToCheck.length === 0) {
    return collector;
  }

  // Check all fields for uniqueness in a single database query
  const conflicts = await countryRepository.checkUniqueness(
    fieldsToCheck,
    currentId,
  );

  // Add errors for each conflict found
  for (const conflict of conflicts) {
    const error = standardFieldErrors.duplicate(
      'Country',
      conflict.field,
      conflict.value as string,
    );
    collector.addError(error.field, error.code, error.message, error.value);
  }

  return collector;
}

/**
 * Validates country data according to business rules
 * @param payload - Country data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @throws {FieldValidationError} If there are validation violations
 */
export async function validateCountry(
  payload: CreateCountryPayload | UpdateCountryPayload,
  currentId?: number,
): Promise<void> {
  const validator = await validateCountryUniqueness(payload, currentId);
  validator.throwIfErrors();
}
