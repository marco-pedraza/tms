import { FieldErrorCollector } from '@repo/base-repo';
import { standardFieldErrors } from '@/shared/errors';
import { technologiesRepository } from '@/inventory/fleet/technologies/technologies.repository';
import { buses } from './buses.schema';
import type { CreateBusPayload, UpdateBusPayload } from './buses.types';
import { AssignTechnologiesToBusPayload } from './buses.types';
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

/**
 * Validates technology assignment payload
 * @param busId - The ID of the bus to validate
 * @param payload - The technology assignment payload to validate
 * @throws {FieldValidationError} If validation fails
 */
export async function validateTechnologyAssignment(
  busId: number,
  payload: AssignTechnologiesToBusPayload,
): Promise<void> {
  const collector = new FieldErrorCollector();

  // Validate that technologyIds array has no duplicates
  const uniqueTechnologyIds = new Set(payload.technologyIds);
  collector.addIf(
    uniqueTechnologyIds.size !== payload.technologyIds.length,
    'technologyIds',
    'DUPLICATE_INPUT',
    'Duplicate technology IDs are not allowed in the assignment',
    payload.technologyIds,
  );
  collector.throwIfErrors(); // Stop immediately if duplicates found

  // Validate bus exists
  const busExists = await busRepository.existsBy(buses.id, busId);
  collector.addIf(
    !busExists,
    'busId',
    'NOT_FOUND',
    `Bus with id ${busId} not found`,
    busId,
  );
  collector.throwIfErrors(); // Stop immediately if bus not found

  // If technologyIds is empty, no need to validate technologies
  if (payload.technologyIds.length === 0) {
    return;
  }

  // Validate all technologies exist using batch operation
  const uniqueTechnologyIdsArray = Array.from(uniqueTechnologyIds);
  const existingTechnologyIds = await technologiesRepository.findExistingIds(
    uniqueTechnologyIdsArray,
  );

  // Find missing technology IDs by comparing requested vs existing
  const missingTechnologyIds = uniqueTechnologyIdsArray.filter(
    (technologyId) => !existingTechnologyIds.includes(technologyId),
  );

  // Add single error for missing technologies if any
  if (missingTechnologyIds.length > 0) {
    collector.addError(
      'technologyIds',
      'NOT_FOUND',
      `Technologies with ids [${missingTechnologyIds.join(', ')}] not found`,
      missingTechnologyIds,
    );
  }
  collector.throwIfErrors(); // Stop immediately if any technologies not found
}
