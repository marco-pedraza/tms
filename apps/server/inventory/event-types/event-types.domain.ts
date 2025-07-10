import { FieldErrorCollector } from '@repo/base-repo';
import { standardFieldErrors } from '../../shared/errors';
import { eventTypes } from './event-types.schema';
import type {
  CreateEventTypePayload,
  UpdateEventTypePayload,
} from './event-types.types';
import { eventTypeRepository } from './event-types.repository';

/**
 * Validate uniqueness constraints for event type data
 * @param payload - Event type data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @param validator - Optional validator to reuse (for combining validations)
 * @returns The validator instance for chaining
 */
export async function validateEventTypeUniqueness(
  payload: CreateEventTypePayload | UpdateEventTypePayload,
  currentId?: number,
  validator?: FieldErrorCollector,
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  const fieldsToCheck = [];

  if (payload.code) {
    fieldsToCheck.push({
      field: eventTypes.code,
      value: payload.code,
    });
  }

  // If no fields to check, return early
  if (fieldsToCheck.length === 0) {
    return collector;
  }

  // Check all fields for uniqueness in a single database query
  const conflicts = await eventTypeRepository.checkUniqueness(
    fieldsToCheck,
    currentId,
  );

  // Add errors for each conflict found
  for (const conflict of conflicts) {
    const error = standardFieldErrors.duplicate(
      'EventType',
      conflict.field,
      conflict.value as string,
    );
    collector.addError(error.field, error.code, error.message, error.value);
  }

  return collector;
}

/**
 * Validates event type data according to business rules
 * @param payload - Event type data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @throws {FieldValidationError} If there are validation violations
 */
export async function validateEventType(
  payload: CreateEventTypePayload | UpdateEventTypePayload,
  currentId?: number,
): Promise<void> {
  const validator = await validateEventTypeUniqueness(payload, currentId);
  validator.throwIfErrors();
}
