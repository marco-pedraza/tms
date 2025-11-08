import { createDomainErrorHelpersWithFields } from '@/shared/domain/domain-errors';

// Rolling plan-specific error configuration
const ROLLING_PLAN_ERROR_CONFIG = {
  buslineNotFound: {
    message: 'Bus line not found',
    field: 'buslineId',
    code: 'NOT_FOUND',
  },
  serviceTypeNotFound: {
    message: 'Service type not found',
    field: 'serviceTypeId',
    code: 'NOT_FOUND',
  },
  busModelNotFound: {
    message: 'Bus model not found',
    field: 'busModelId',
    code: 'NOT_FOUND',
  },
  baseNodeNotFound: {
    message: 'Base node not found',
    field: 'baseNodeId',
    code: 'NOT_FOUND',
  },
  cycleDurationDaysRequired: {
    message: 'Cycle duration days is required for continuous operation type',
    field: 'cycleDurationDays',
    code: 'REQUIRED',
  },
  cycleDurationDaysInvalid: {
    message: 'Cycle duration days must be at least 1',
    field: 'cycleDurationDays',
    code: 'INVALID_VALUE',
  },
  operationDaysRequired: {
    message:
      'Operation days configuration is required for specific_days operation type',
    field: 'operationDays',
    code: 'REQUIRED',
  },
  operationDaysInvalidType: {
    message: 'Operation days must be an object',
    field: 'operationDays',
    code: 'INVALID_VALUE',
  },
  operationDaysInvalidKeys: {
    message:
      'Operation days can only contain valid day keys: monday, tuesday, wednesday, thursday, friday, saturday, sunday',
    field: 'operationDays',
    code: 'INVALID_VALUE',
  },
  operationDaysInvalidValues: {
    message: 'Operation days can only have true values',
    field: 'operationDays',
    code: 'INVALID_VALUE',
  },
  operationDaysAtLeastOne: {
    message: 'At least one operation day must be configured',
    field: 'operationDays',
    code: 'INVALID_VALUE',
  },
  updateNotPersisted: {
    message:
      'Cannot update a rolling plan that has not been persisted yet. Call save() first.',
    field: 'id',
    code: 'INVALID_STATE',
  },
} as const;

// Generate error helpers automatically
const baseRollingPlanErrors = createDomainErrorHelpersWithFields(
  ROLLING_PLAN_ERROR_CONFIG,
);

/**
 * Helper functions to add rolling plan-specific errors to collector
 */
export const rollingPlanErrors = {
  // Use generated helpers for base rolling plan errors
  ...baseRollingPlanErrors,
};
