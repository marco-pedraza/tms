import { FieldErrorCollector } from '@repo/base-repo';
import { standardFieldErrors } from '../../shared/errors';
import { nodes } from './nodes.schema';
import type { CreateNodePayload, UpdateNodePayload } from './nodes.types';
import { nodeRepository } from './nodes.repository';

/**
 * Validate uniqueness constraints for node data
 * @param payload - Node data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @param validator - Optional validator to reuse (for combining validations)
 * @returns The validator instance for chaining
 */
export async function validateNodeUniqueness(
  payload: CreateNodePayload | UpdateNodePayload,
  currentId?: number,
  validator?: FieldErrorCollector,
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  // Prepare fields to check for uniqueness
  const fieldsToCheck = [];

  if (payload.code) {
    fieldsToCheck.push({
      field: nodes.code,
      value: payload.code,
    });
  }

  // If no fields to check, return early
  if (fieldsToCheck.length === 0) {
    return collector;
  }

  // Check all fields for uniqueness in a single database query
  const conflicts = await nodeRepository.checkUniqueness(
    fieldsToCheck,
    currentId,
  );

  // Add errors for each conflict found
  for (const conflict of conflicts) {
    const error = standardFieldErrors.duplicate(
      'Node',
      conflict.field,
      conflict.value as string,
    );
    collector.addError(error.field, error.code, error.message, error.value);
  }

  return collector;
}

/**
 * Validates node data according to business rules
 * @param payload - Node data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @throws {FieldValidationError} If there are validation violations
 */
export async function validateNode(
  payload: CreateNodePayload | UpdateNodePayload,
  currentId?: number,
): Promise<void> {
  const validator = await validateNodeUniqueness(payload, currentId);
  // TODO: Add foreign key validation for cityId, populationId, and installationId
  validator.throwIfErrors();
}
