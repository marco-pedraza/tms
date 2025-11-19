import { FieldErrorCollector } from '@repo/base-repo';
import { createDomainErrorHelpersWithFields } from '@/shared/domain/domain-errors';
import { standardFieldErrors } from '@/shared/errors';
import type { DriverStatus } from './drivers.types';
import {
  getValidInitialStatuses,
  getValidNextStatuses,
} from './drivers.domain';

// Driver-specific error configuration
const DRIVER_ERROR_CONFIG = {
  cannotOperateOnNonPersisted: {
    message:
      'Cannot operate on a driver that has not been persisted yet. Call save() first.',
    field: 'id',
    code: 'NOT_PERSISTED',
  },
  busLineNotFound: {
    message: 'Bus line not found',
    field: 'busLineId',
    code: 'NOT_FOUND',
  },
  timeOffInvalidDateRange: {
    message: 'Start date must be less than or equal to end date',
    field: 'startDate',
    code: 'INVALID_DATE_RANGE',
  },
  timeOffOverlapping: {
    message: 'This time-off period overlaps with an existing time-off',
    field: 'startDate',
    code: 'OVERLAPPING_TIME_OFF',
  },
  timeOffNotFound: {
    message: 'Time-off not found for this driver',
    field: 'timeOffId',
    code: 'NOT_FOUND',
  },
} as const;

// Generate error helpers automatically
const baseDriverErrors =
  createDomainErrorHelpersWithFields(DRIVER_ERROR_CONFIG);

/**
 * Helper functions to add driver-specific errors to collector
 */
export const driverErrors = {
  // Use generated helpers for base driver errors
  ...baseDriverErrors,

  /**
   * Adds an error for invalid initial status
   * Uses standardFieldErrors for informative messages with valid statuses
   * @param collector - The field error collector
   * @param attemptedStatus - The invalid status attempted
   */
  invalidInitialStatus: (
    collector: FieldErrorCollector,
    attemptedStatus: DriverStatus,
  ): void => {
    const validStatuses = getValidInitialStatuses();
    const error = standardFieldErrors.invalidStatus(
      'Driver',
      null,
      attemptedStatus,
      validStatuses,
      true, // isInitial
    );
    collector.addError(error.field, error.code, error.message, error.value);
  },

  /**
   * Adds an error for invalid status transition
   * Uses standardFieldErrors for informative messages with valid transitions
   * @param collector - The field error collector
   * @param currentStatus - The current status
   * @param newStatus - The invalid status attempted
   */
  invalidStatusTransition: (
    collector: FieldErrorCollector,
    currentStatus: DriverStatus,
    newStatus: DriverStatus,
  ): void => {
    const allowedTransitions = getValidNextStatuses(currentStatus);
    const error = standardFieldErrors.invalidStatus(
      'Driver',
      currentStatus,
      newStatus,
      allowedTransitions,
      false, // isInitial
    );
    collector.addError(error.field, error.code, error.message, error.value);
  },
};
