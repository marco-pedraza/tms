import { FieldErrorCollector } from '@repo/base-repo';
import { STANDARD_ERROR_CODES } from '@/shared/errors';
import { busModels } from './bus-models.schema';
import type {
  CreateBusModelPayload,
  UpdateBusModelPayload,
} from './bus-models.types';
import { busModelRepository } from './bus-models.repository';

/**
 * Validates uniqueness constraints for bus model data
 * Ensures that the combination of manufacturer, model, and year is unique
 */
async function validateBusModelUniqueness(
  payload: CreateBusModelPayload | UpdateBusModelPayload,
  currentId?: number,
  validator?: FieldErrorCollector,
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  // Early return if no validation needed
  if (!payload.manufacturer && !payload.model && payload.year === undefined) {
    return collector;
  }

  // Prepare composite key values for uniqueness check
  let manufacturer: string | undefined;
  let model: string | undefined;
  let year: number | undefined;

  if (currentId) {
    // For updates, merge payload with current values
    const currentBusModel = await busModelRepository.findOne(currentId);

    if (!currentBusModel) {
      // Let the caller handle 404s centrally
      return collector;
    }

    const updatePayload = payload as UpdateBusModelPayload;
    manufacturer = updatePayload.manufacturer ?? currentBusModel.manufacturer;
    model = updatePayload.model ?? currentBusModel.model;
    year = updatePayload.year ?? currentBusModel.year;
  } else {
    // For creates, use payload values directly
    const createPayload = payload as CreateBusModelPayload;
    manufacturer = createPayload.manufacturer;
    model = createPayload.model;
    year = createPayload.year;

    // Skip uniqueness check if required fields are missing
    if (!manufacturer || !model || year === undefined) {
      return collector;
    }
  }

  // Check for existing bus model with same composite key
  const existingBusModel = await busModelRepository.findOneBy([
    { field: busModels.manufacturer, value: manufacturer },
    { field: busModels.model, value: model },
    { field: busModels.year, value: year },
  ]);

  // Add validation error if duplicate found
  if (existingBusModel && (!currentId || existingBusModel.id !== currentId)) {
    const errorMessage =
      'A bus model with this manufacturer, model, and year combination already exists';

    // Add error to each field that contributes to the uniqueness constraint
    collector.addError(
      'manufacturer',
      STANDARD_ERROR_CODES.DUPLICATE,
      errorMessage,
      manufacturer,
    );
    collector.addError(
      'model',
      STANDARD_ERROR_CODES.DUPLICATE,
      errorMessage,
      model,
    );
    collector.addError(
      'year',
      STANDARD_ERROR_CODES.DUPLICATE,
      errorMessage,
      year,
    );
  }

  return collector;
}

/**
 * Validates bus model data according to business rules
 * @throws {FieldValidationError} If there are validation violations
 */
async function validateBusModel(
  payload: CreateBusModelPayload | UpdateBusModelPayload,
  currentId?: number,
): Promise<void> {
  const validator = await validateBusModelUniqueness(payload, currentId);
  validator.throwIfErrors();
}

/**
 * Creates domain functions for managing bus model business logic
 */
export function createBusModelDomain() {
  return {
    validateBusModel,
    validateBusModelUniqueness,
  };
}

// Export the domain instance
export const busModelDomain = createBusModelDomain();
