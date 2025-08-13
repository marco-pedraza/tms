import { FieldErrorCollector } from '@repo/base-repo';
import { standardFieldErrors } from '@/shared/errors';
import { busLines } from './bus-lines.schema';
import type {
  CreateBusLinePayload,
  UpdateBusLinePayload,
} from './bus-lines.types';
import { busLineRepository } from './bus-lines.repository';

/**
 * Validate uniqueness constraints for bus line data
 * @param payload - Bus line data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @param validator - Optional validator to reuse (for combining validations)
 * @returns The validator instance for chaining
 */
export async function validateBusLineUniqueness(
  payload: CreateBusLinePayload | UpdateBusLinePayload,
  currentId?: number,
  validator?: FieldErrorCollector,
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  // Prepare fields to check for uniqueness
  const fieldsToCheck = [];

  if (payload.code) {
    fieldsToCheck.push({
      field: busLines.code,
      value: payload.code,
    });
  }

  if (payload.name) {
    fieldsToCheck.push({
      field: busLines.name,
      value: payload.name,
    });
  }

  // If no fields to check, return early
  if (fieldsToCheck.length === 0) {
    return collector;
  }

  // Check all fields for uniqueness in a single database query
  const conflicts = await busLineRepository.checkUniqueness(
    fieldsToCheck,
    currentId,
  );

  // Add errors for each conflict found
  for (const conflict of conflicts) {
    const error = standardFieldErrors.duplicate(
      'Bus Line',
      conflict.field,
      conflict.value as string,
    );
    collector.addError(error.field, error.code, error.message, error.value);
  }

  return collector;
}

/**
 * Validates bus line data according to business rules
 * @param payload - Bus line data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @throws {FieldValidationError} If there are validation violations
 */
export async function validateBusLine(
  payload: CreateBusLinePayload | UpdateBusLinePayload,
  currentId?: number,
): Promise<void> {
  const validator = await validateBusLineUniqueness(payload, currentId);
  validator.throwIfErrors();
}
