import { FieldErrorCollector } from '@repo/base-repo';
import { standardFieldErrors } from '../../shared/errors';
import { states } from './states.schema';
import type { CreateStatePayload, UpdateStatePayload } from './states.types';
import { stateRepository } from './states.repository';

const ENTITY_NAME = 'State';

/**
 * Validate uniqueness constraints for state data
 * @param payload - State data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @param validator - Optional validator to reuse (for combining validations)
 * @returns The validator instance for chaining
 */
export async function validateStateUniqueness(
  payload: CreateStatePayload | UpdateStatePayload,
  currentId?: number,
  validator?: FieldErrorCollector,
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  if (payload.name) {
    const nameExists = await stateRepository.existsBy(
      states.name,
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

  if (payload.code) {
    const codeExists = await stateRepository.existsBy(
      states.code,
      payload.code,
      currentId,
    );
    if (codeExists) {
      const error = standardFieldErrors.duplicate(
        ENTITY_NAME,
        'code',
        payload.code,
      );
      collector.addError(error.field, error.code, error.message, error.value);
    }
  }

  return collector;
}

/**
 * Validates state data according to business rules
 * @param payload - State data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @throws {FieldValidationError} If there are validation violations
 */
export async function validateState(
  payload: CreateStatePayload | UpdateStatePayload,
  currentId?: number,
): Promise<void> {
  const validator = await validateStateUniqueness(payload, currentId);
  validator.throwIfErrors();
}
