import { FieldErrorCollector } from '@repo/base-repo';
import { standardFieldErrors } from '../../shared/errors';
import { installationTypes } from './installation-types.schema';
import type {
  CreateInstallationTypePayload,
  UpdateInstallationTypePayload,
} from './installation-types.types';
import { installationTypeRepository } from './installation-types.repository';

/**
 * Validate uniqueness constraints for installation type data
 * @param payload - Installation type data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @param validator - Optional validator to reuse (for combining validations)
 * @returns The validator instance for chaining
 */
export async function validateInstallationTypeUniqueness(
  payload: CreateInstallationTypePayload | UpdateInstallationTypePayload,
  currentId?: number,
  validator?: FieldErrorCollector,
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  // Prepare fields to check for uniqueness
  const fieldsToCheck = [];

  if (payload.name) {
    fieldsToCheck.push({
      field: installationTypes.name,
      value: payload.name,
    });
  }

  // If no fields to check, return early
  if (fieldsToCheck.length === 0) {
    return collector;
  }

  // Check all fields for uniqueness in a single database query
  const conflicts = await installationTypeRepository.checkUniqueness(
    fieldsToCheck,
    currentId,
  );

  // Add errors for each conflict found
  for (const conflict of conflicts) {
    const error = standardFieldErrors.duplicate(
      'InstallationType',
      conflict.field,
      conflict.value as string,
    );
    collector.addError(error.field, error.code, error.message, error.value);
  }

  return collector;
}

/**
 * Validates installation type data according to business rules
 * @param payload - Installation type data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @throws {FieldValidationError} If there are validation violations
 */
export async function validateInstallationType(
  payload: CreateInstallationTypePayload | UpdateInstallationTypePayload,
  currentId?: number,
): Promise<void> {
  const validator = await validateInstallationTypeUniqueness(
    payload,
    currentId,
  );
  validator.throwIfErrors();
}
