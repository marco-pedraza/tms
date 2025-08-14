import { FieldErrorCollector } from '@repo/base-repo';
import { standardFieldErrors } from '@/shared/errors';
import { serviceTypes } from './service-types.schema';
import type {
  CreateServiceTypePayload,
  UpdateServiceTypePayload,
} from './service-types.types';
import { serviceTypeRepository } from './service-types.repository';

/**
 * Validate uniqueness constraints for service type data
 * @param payload - Service type data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @param validator - Optional validator to reuse (for combining validations)
 * @returns The validator instance for chaining
 */
export async function validateServiceTypeUniqueness(
  payload: CreateServiceTypePayload | UpdateServiceTypePayload,
  currentId?: number,
  validator?: FieldErrorCollector,
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  // Prepare fields to check for uniqueness
  const fieldsToCheck = [];

  if (payload.code) {
    fieldsToCheck.push({ field: serviceTypes.code, value: payload.code });
  }

  if (payload.name) {
    fieldsToCheck.push({ field: serviceTypes.name, value: payload.name });
  }

  // If no fields to check, return early
  if (fieldsToCheck.length === 0) {
    return collector;
  }

  // Check all fields for uniqueness in a single database query
  const conflicts = await serviceTypeRepository.checkUniqueness(
    fieldsToCheck,
    currentId,
  );

  // Add errors for each conflict found
  for (const conflict of conflicts) {
    const error = standardFieldErrors.duplicate(
      'Service Type',
      conflict.field,
      conflict.value as string,
    );
    collector.addError(error.field, error.code, error.message, error.value);
  }

  return collector;
}

/**
 * Validates service type data according to business rules
 * @param payload - Service type data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @throws {FieldValidationError} If there are validation violations
 */
export async function validateServiceType(
  payload: CreateServiceTypePayload | UpdateServiceTypePayload,
  currentId?: number,
): Promise<void> {
  const validator = await validateServiceTypeUniqueness(payload, currentId);
  validator.throwIfErrors();
}
