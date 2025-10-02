import { createDomainErrorHelpersWithFields } from '@/shared/domain/domain-errors';

// Pathway Option-specific error configuration
const PATHWAY_OPTION_ERROR_CONFIG = {
  distanceRequired: {
    message: 'Distance in kilometers is required and must be greater than 0',
    field: 'distanceKm',
    code: 'REQUIRED_POSITIVE',
  },
  timeRequired: {
    message: 'Typical time in minutes is required and must be greater than 0',
    field: 'typicalTimeMin',
    code: 'REQUIRED_POSITIVE',
  },
  passThroughRequiresTime: {
    message:
      'Pass-through options require a positive pass-through time in minutes',
    field: 'passThroughTimeMin',
  },
  passThroughTimeWithoutFlag: {
    message: 'Pass-through time cannot be set when pass-through is disabled',
    field: 'passThroughTimeMin',
  },
  defaultRequiresActive: {
    message: 'Default options must be active',
    field: 'isDefault',
  },
  // Toll-related errors
  duplicateTollNode: {
    message: 'Duplicate toll node found in the same pathway option',
    field: 'tolls',
    code: 'DUPLICATE_NODE',
  },
  consecutiveDuplicateToll: {
    message: 'Consecutive duplicate toll nodes are not allowed',
    field: 'tolls',
    code: 'CONSECUTIVE_DUPLICATE',
  },
  tollNodeNotFound: {
    message: 'Toll node not found',
    field: 'tolls',
    code: 'NODE_NOT_FOUND',
  },
  cannotSyncTollsOnNonPersisted: {
    message: 'Cannot sync tolls on non-persisted pathway option',
    field: 'tolls',
    code: 'NOT_PERSISTED',
  },
  cannotGetTollsFromNonPersisted: {
    message: 'Cannot get tolls from non-persisted pathway option',
    field: 'tolls',
    code: 'NOT_PERSISTED',
  },
} as const;

// Generate error helpers automatically
const basePathwayOptionErrors = createDomainErrorHelpersWithFields(
  PATHWAY_OPTION_ERROR_CONFIG,
);

/**
 * Helper functions to add pathway option-specific errors to collector
 */
export const pathwayOptionErrors = {
  // All errors can be generated automatically since they're all simple cases
  ...basePathwayOptionErrors,
};
