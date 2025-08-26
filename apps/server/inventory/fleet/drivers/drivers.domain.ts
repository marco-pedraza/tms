import { FieldErrorCollector } from '@repo/base-repo';
import { StateTransition, createBaseStateMachine } from '@repo/state-machine';
import { standardFieldErrors } from '../../../shared/errors';
import { drivers } from './drivers.schema';
import type { CreateDriverPayload, UpdateDriverPayload } from './drivers.types';
import { DriverStatus } from './drivers.types';
import { driverRepository } from './drivers.repository';

/**
 * Status transition map defining allowed transitions between driver statuses
 */
const STATUS_TRANSITIONS: StateTransition<DriverStatus>[] = [
  {
    from: DriverStatus.ACTIVE,
    to: [
      DriverStatus.INACTIVE,
      DriverStatus.SUSPENDED,
      DriverStatus.ON_LEAVE,
      DriverStatus.TERMINATED,
    ],
  },
  {
    from: DriverStatus.INACTIVE,
    to: [DriverStatus.ACTIVE, DriverStatus.TERMINATED],
  },
  {
    from: DriverStatus.SUSPENDED,
    to: [DriverStatus.ACTIVE, DriverStatus.TERMINATED],
  },
  {
    from: DriverStatus.ON_LEAVE,
    to: [DriverStatus.ACTIVE, DriverStatus.TERMINATED],
  },
  { from: DriverStatus.TERMINATED, to: [] }, // Terminal state - no transitions allowed
  {
    from: DriverStatus.IN_TRAINING,
    to: [DriverStatus.ACTIVE, DriverStatus.PROBATION, DriverStatus.TERMINATED],
  },
  {
    from: DriverStatus.PROBATION,
    to: [DriverStatus.ACTIVE, DriverStatus.TERMINATED],
  },
];

/**
 * Allowed initial states for new drivers
 */
export const ALLOWED_INITIAL_STATUSES: readonly DriverStatus[] = [
  DriverStatus.IN_TRAINING,
  DriverStatus.ACTIVE,
  DriverStatus.PROBATION,
];

/**
 * State machine for driver status transitions
 */
const stateMachine = createBaseStateMachine<DriverStatus>(
  STATUS_TRANSITIONS,
  'Driver',
);

/**
 * Gets all valid initial statuses for new drivers
 * @returns {DriverStatus[]} Array of valid initial statuses
 */
export function getValidInitialStatuses(): DriverStatus[] {
  return [...ALLOWED_INITIAL_STATUSES];
}

/**
 * Gets all possible next statuses for a given current status
 * @param {DriverStatus} currentStatus - The current status
 * @returns {DriverStatus[]} Array of possible next statuses
 */
export function getValidNextStatuses(
  currentStatus: DriverStatus,
): DriverStatus[] {
  return stateMachine.getPossibleNextStates(currentStatus);
}

/**
 * Validates if a status is a valid initial status for new drivers
 * @param {DriverStatus} status - The status to validate
 * @returns {boolean} True if the status is valid for initial state
 */
export function isValidInitialStatus(status: DriverStatus): boolean {
  return ALLOWED_INITIAL_STATUSES.includes(status);
}

/**
 * Validates if a status transition is valid
 * @param {DriverStatus} currentStatus - The current status
 * @param {DriverStatus} newStatus - The new status to transition to
 * @returns {boolean} True if the transition is valid
 */
export function isValidStatusTransition(
  currentStatus: DriverStatus,
  newStatus: DriverStatus,
): boolean {
  return stateMachine.canTransition(currentStatus, newStatus);
}

/**
 * Validates uniqueness constraints for driver data
 * @param payload - The driver data to validate
 * @param currentId - Current driver ID for update operations (to exclude from uniqueness check)
 * @param validator - Optional existing field error collector
 * @returns Promise<FieldErrorCollector> The field error collector with any validation errors
 */
export async function validateDriverUniqueness(
  payload: CreateDriverPayload | UpdateDriverPayload,
  currentId?: number,
  validator?: FieldErrorCollector,
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  const fieldsToCheck = [];

  if (payload.driverKey) {
    fieldsToCheck.push({
      field: drivers.driverKey,
      value: payload.driverKey,
    });
  }

  if (payload.payrollKey) {
    fieldsToCheck.push({
      field: drivers.payrollKey,
      value: payload.payrollKey,
    });
  }

  if (fieldsToCheck.length > 0) {
    const conflicts = await driverRepository.checkUniqueness(
      fieldsToCheck,
      currentId,
    );

    for (const conflict of conflicts) {
      const error = standardFieldErrors.duplicate(
        'Driver',
        conflict.field,
        conflict.value as string,
      );
      collector.addError(error.field, error.code, error.message, error.value);
    }
  }

  return collector;
}

/**
 * Validates driver status for creation (initial status validation)
 * @param payload - The driver creation data to validate
 * @param validator - Optional existing field error collector
 * @returns FieldErrorCollector The field error collector with any validation errors
 */
export function validateDriverStatusForCreate(
  payload: CreateDriverPayload,
  validator?: FieldErrorCollector,
): FieldErrorCollector {
  const collector = validator || new FieldErrorCollector();

  if (payload.status && !isValidInitialStatus(payload.status)) {
    const validInitialStatuses = getValidInitialStatuses();
    const error = standardFieldErrors.invalidStatus(
      'Driver',
      null,
      payload.status,
      validInitialStatuses,
      true,
    );
    collector.addError(error.field, error.code, error.message, error.value);
  }

  return collector;
}

/**
 * Validates driver status for updates (status transition validation)
 * @param payload - The driver update data to validate
 * @param currentStatus - The current status of the driver
 * @param validator - Optional existing field error collector
 * @returns FieldErrorCollector The field error collector with any validation errors
 */
export function validateDriverStatusForUpdate(
  payload: UpdateDriverPayload,
  currentStatus: DriverStatus,
  validator?: FieldErrorCollector,
): FieldErrorCollector {
  const collector = validator || new FieldErrorCollector();

  // Only validate if status is being updated AND it's different from current status
  if (payload.status && payload.status !== currentStatus) {
    const newStatus = payload.status;

    // Check if the transition is valid using domain's functions
    if (!isValidStatusTransition(currentStatus, newStatus)) {
      // Get allowed transitions for error message
      const allowedTransitions = getValidNextStatuses(currentStatus);

      const error = standardFieldErrors.invalidStatus(
        'Driver',
        currentStatus,
        newStatus,
        allowedTransitions,
        false,
      );
      collector.addError(error.field, error.code, error.message, error.value);
    }
  }

  return collector;
}

/**
 * Validates driver status for updates with driver lookup (status transition validation)
 * This function fetches the current driver and validates the status transition
 * @param payload - The driver update data to validate
 * @param currentId - Current driver ID for retrieving current status
 * @param validator - Optional existing field error collector
 * @returns Promise<FieldErrorCollector> The field error collector with any validation errors
 */
export async function validateDriverStatusForUpdateWithLookup(
  payload: UpdateDriverPayload,
  currentId: number,
  validator?: FieldErrorCollector,
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  // Only validate if status is being updated
  if (payload.status) {
    // Get current driver to check status transition
    const currentDriver = await driverRepository.findOne(currentId);
    const currentStatus = currentDriver.status as DriverStatus;

    // Use the status validation function
    validateDriverStatusForUpdate(payload, currentStatus, collector);
  }

  return collector;
}

/**
 * Main validation function that combines all business rules for drivers
 * @param payload - The driver data to validate
 * @param currentId - Current driver ID for update operations (to exclude from uniqueness check)
 * @throws {FieldValidationError} If validation fails
 */
export async function validateDriver(
  payload: CreateDriverPayload | UpdateDriverPayload,
  currentId?: number,
): Promise<void> {
  // Start with uniqueness validation
  const validator = await validateDriverUniqueness(payload, currentId);

  // Add status validation based on operation type
  if (currentId) {
    // Update operation - validate status transitions
    await validateDriverStatusForUpdateWithLookup(
      payload as UpdateDriverPayload,
      currentId,
      validator,
    );
  } else {
    // Create operation - validate initial status
    validateDriverStatusForCreate(payload as CreateDriverPayload, validator);
  }

  // Throw if any validation errors were found
  validator.throwIfErrors();
}
