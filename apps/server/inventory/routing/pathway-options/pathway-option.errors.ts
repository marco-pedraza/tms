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
