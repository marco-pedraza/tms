import { FieldErrorCollector } from '@repo/base-repo';
import { standardFieldErrors } from '../../../shared/errors';
import { busDiagramModels } from './bus-diagram-models.schema';
import type {
  CreateBusDiagramModelPayload,
  UpdateBusDiagramModelPayload,
} from './bus-diagram-models.types';
import { busDiagramModelRepository } from './bus-diagram-models.repository';

/**
 * Validates uniqueness constraints for bus diagram model data
 * @param payload - Bus diagram model data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @param validator - Optional existing FieldErrorCollector to add errors to
 * @returns FieldErrorCollector with any validation errors found
 */
export async function validateBusDiagramModelUniqueness(
  payload: CreateBusDiagramModelPayload | UpdateBusDiagramModelPayload,
  currentId?: number,
  validator?: FieldErrorCollector,
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  // Prepare fields to check for uniqueness
  const fieldsToCheck = [];
  if (payload.name) {
    fieldsToCheck.push({
      field: busDiagramModels.name,
      value: payload.name,
    });
  }

  // Check uniqueness constraints in a single query
  const conflicts = await busDiagramModelRepository.checkUniqueness(
    fieldsToCheck,
    currentId,
  );

  // Add standardized errors for any conflicts found
  for (const conflict of conflicts) {
    const error = standardFieldErrors.duplicate(
      'BusDiagramModel',
      conflict.field,
      conflict.value as string,
    );
    collector.addError(error.field, error.code, error.message, error.value);
  }

  return collector;
}

/**
 * Validates bus diagram model data according to business rules
 * @param payload - Bus diagram model data to validate
 * @param currentId - ID of the current entity to exclude from uniqueness check (for updates)
 * @throws {FieldValidationError} If there are validation violations
 */
export async function validateBusDiagramModel(
  payload: CreateBusDiagramModelPayload | UpdateBusDiagramModelPayload,
  currentId?: number,
): Promise<void> {
  const validator = await validateBusDiagramModelUniqueness(payload, currentId);
  validator.throwIfErrors();
}
