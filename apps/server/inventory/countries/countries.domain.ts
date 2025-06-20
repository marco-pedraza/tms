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

  // Check each field individually for specific error messages
  if (payload.code) {
    const codeExists = await countryRepository.existsBy(
      countries.code,
      payload.code,
      currentId,
    );
    if (codeExists) {
      const error = standardFieldErrors.duplicate(
        'Country',
        'code',
        payload.code,
      );
      collector.addError(error.field, error.code, error.message, error.value);
    }
  }

  if (payload.name) {
    const nameExists = await countryRepository.existsBy(
      countries.name,
      payload.name,
      currentId,
    );
    if (nameExists) {
      const error = standardFieldErrors.duplicate(
        'Country',
        'name',
        payload.name,
      );
      collector.addError(error.field, error.code, error.message, error.value);
    }
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
