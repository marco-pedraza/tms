import { FieldErrorCollector } from '@repo/base-repo';
import { standardFieldErrors } from '../../shared/errors';
import { buses } from './buses.schema';
import type { CreateBusPayload, UpdateBusPayload } from './buses.types';
import { busRepository } from './buses.repository';

const ENTITY_NAME = 'Bus';

/**
 * Validate uniqueness constraints for bus data
 * @param payload - Bus data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @param validator - Optional validator to reuse (for combining validations)
 * @returns The validator instance for chaining
 */
export async function validateBusUniqueness(
  payload: CreateBusPayload | UpdateBusPayload,
  currentId?: number,
  validator?: FieldErrorCollector,
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  // Early return if no validation needed
  if (!payload.registrationNumber && !payload.licensePlateNumber) {
    return collector;
  }

  // Prepare field to check for uniqueness
  const fieldsToCheck = [
    {
      field: buses.registrationNumber,
      value: payload.registrationNumber,
    },
    {
      field: buses.licensePlateNumber,
      value: payload.licensePlateNumber,
    },
  ];

  // Check uniqueness and add errors
  const conflicts = await busRepository.checkUniqueness(
    fieldsToCheck,
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
 * Validates bus data according to business rules
 * @param payload - Bus data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @throws {FieldValidationError} If there are validation violations
 */
export async function validateBus(
  payload: CreateBusPayload | UpdateBusPayload,
  currentId?: number,
): Promise<void> {
  const validator = await validateBusUniqueness(payload, currentId);
  validator.throwIfErrors();
}
