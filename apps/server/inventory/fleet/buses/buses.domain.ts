import { FieldErrorCollector } from '@repo/base-repo';
import { standardFieldErrors } from '@/shared/errors';
import { driverRepository } from '@/inventory/fleet/drivers/drivers.repository';
import { technologiesRepository } from '@/inventory/fleet/technologies/technologies.repository';
import { buses } from './buses.schema';
import type {
  AssignDriverToBusCrewPayload,
  AssignTechnologiesToBusPayload,
  CreateBusPayload,
  UpdateBusPayload,
} from './buses.types';
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

/**
 * Validates bus crew data according to business rules
 * @param payload - Bus crew data to validate
 * @param busId - ID of the bus to assign the driver
 * @throws {FieldValidationError} If there are validation violations
 */
export async function validateDriverAssignmentToBusCrew(
  busId: number,
  payload: AssignDriverToBusCrewPayload,
): Promise<void> {
  const collector = new FieldErrorCollector();

  // Validate that driverIds array has no duplicates
  const uniqueDriverIds = new Set(payload.driverIds);
  collector.addIf(
    uniqueDriverIds.size !== payload.driverIds.length,
    'driverIds',
    'DUPLICATE_INPUT',
    'Duplicate driver IDs are not allowed in the assignment',
    payload.driverIds,
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
  collector.throwIfErrors();

  // If driverIds is empty, no need to validate drivers
  if (payload.driverIds.length === 0) {
    return;
  }

  // Validate drivers exists
  const driversExists = await driverRepository.findExistingIds(
    payload.driverIds,
  );

  const missingDriverIds = payload.driverIds.filter(
    (driverId) => !driversExists.includes(driverId),
  );

  collector.addIf(
    missingDriverIds.length > 0,
    'driverIds',
    'NOT_FOUND',
    `Drivers with ids [${missingDriverIds.join(', ')}] not found`,
    missingDriverIds,
  );
  collector.throwIfErrors();

  // Validate if drivers belong to same bus line
  const bus = await busRepository.findOne(busId);
  // Fetch with assignedBus relation to validate cross-bus conflicts
  const drivers = await driverRepository.findManyWithRelationsByIds(
    payload.driverIds,
  );

  const wrongLineIds = drivers
    .filter((d) => d.busLineId !== bus.busLineId)
    .map((d) => d.id);

  collector.addIf(
    wrongLineIds.length > 0,
    'driverIds',
    'INVALID_ASSIGNMENT',
    `Drivers with ids [${wrongLineIds.join(', ')}] do not belong to bus line ${bus.busLineId}`,
    wrongLineIds,
  );
  collector.throwIfErrors();

  // Prevent drivers already assigned to another bus
  const conflicts = drivers.filter(
    (d) => d.assignedBus && d.assignedBus.id !== busId,
  );
  collector.addIf(
    conflicts.length > 0,
    'driverIds',
    'ALREADY_ASSIGNED',
    `Drivers already assigned to other buses: ${conflicts
      .map((d) => `${d.id}->${d.assignedBus?.id ?? 'unknown'}`)
      .join(', ')}`,
    conflicts.map((d) => d.id),
  );
  collector.throwIfErrors();
}
