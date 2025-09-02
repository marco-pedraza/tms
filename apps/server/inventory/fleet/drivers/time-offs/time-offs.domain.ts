import { FieldErrorCollector } from '@repo/base-repo';
import { formatDateToString } from '@/shared/utils';
import { driverRepository } from '../../drivers/drivers.repository';
import type {
  CreateDriverTimeOffPayload,
  UpdateDriverTimeOffPayload,
} from './time-offs.types';
import { driverTimeOffRepository } from './time-offs.repository';

/**
 * Validate date range constraints for time-off data
 * @param payload - Time-off data to validate
 * @param validator - Optional validator to reuse (for combining validations)
 * @returns The validator instance for chaining
 */
export function validateTimeOffDateRange(
  payload: CreateDriverTimeOffPayload | UpdateDriverTimeOffPayload,
  validator?: FieldErrorCollector,
): FieldErrorCollector {
  const collector = validator || new FieldErrorCollector();

  // Check if both dates are provided (either both or neither should be provided for updates)
  if (payload.startDate && payload.endDate) {
    const startDate = new Date(payload.startDate);
    const endDate = new Date(payload.endDate);

    // Validate that start date is not after end date
    if (startDate > endDate) {
      collector.addError(
        'startDate',
        'INVALID_DATE_RANGE',
        'Start date must be less than or equal to end date',
        payload.startDate,
      );
      // Return early if date range is invalid, no point checking other validations
      return collector;
    }

    // Then validate that start date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

    // Normalize start date to start of day for comparison
    const normalizedStartDate = new Date(startDate);
    normalizedStartDate.setHours(0, 0, 0, 0);

    if (normalizedStartDate < today) {
      collector.addError(
        'startDate',
        'PAST_DATE_NOT_ALLOWED',
        'Start date cannot be in the past',
        payload.startDate,
      );
    }
  }

  return collector;
}

/**
 * Validates if a time-off overlaps with an existing time-off
 * @param driverId - ID of the driver
 * @param payload - Time-off data to validate
 * @param currentId - ID of the current entity to exclude from overlap check (for updates)
 * @param validator - Optional validator to reuse (for combining validations)
 * @returns The validator instance for chaining
 */
export async function validateTimeOffOverlap(
  driverId: number,
  payload: CreateDriverTimeOffPayload | UpdateDriverTimeOffPayload,
  currentId?: number,
  validator?: FieldErrorCollector,
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  // Only check overlap if we have both dates
  if (payload.startDate && payload.endDate) {
    const startDateStr = formatDateToString(payload.startDate);
    const endDateStr = formatDateToString(payload.endDate);

    const hasOverlap = await driverTimeOffRepository.hasOverlappingTimeOffs(
      driverId,
      startDateStr,
      endDateStr,
      currentId,
    );

    if (hasOverlap) {
      collector.addError(
        'startDate',
        'OVERLAPPING_TIME_OFF',
        'This time-off period overlaps with an existing time-off',
        startDateStr,
      );
    }
  }

  return collector;
}

/**
 * Validates if a driver exists
 * @param driverId - ID of the driver to validate
 * @param validator - Optional validator to reuse (for combining validations)
 * @returns The validator instance for chaining
 */
export async function validateDriverExists(
  driverId: number,
  validator?: FieldErrorCollector,
): Promise<FieldErrorCollector> {
  const collector = validator || new FieldErrorCollector();

  try {
    await driverRepository.findOne(driverId);
  } catch {
    collector.addError('driverId', 'NOT_FOUND', 'Driver not found', driverId);
  }

  return collector;
}

/**
 * Validates driver time-off data according to business rules
 * @param driverId - ID of the driver
 * @param payload - Time-off data to validate
 * @param currentId - ID of the current entity to exclude from overlap check (for updates)
 * @throws {FieldValidationError} If there are validation violations
 */
export async function validateDriverTimeOff(
  driverId: number,
  payload: CreateDriverTimeOffPayload | UpdateDriverTimeOffPayload,
  currentId?: number,
): Promise<void> {
  let validator = new FieldErrorCollector();

  // Validate driver exists
  validator = await validateDriverExists(driverId, validator);

  // Validate date range
  validator = validateTimeOffDateRange(payload, validator);

  // Validate overlap constraints
  validator = await validateTimeOffOverlap(
    driverId,
    payload,
    currentId,
    validator,
  );

  validator.throwIfErrors();
}
