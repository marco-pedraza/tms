import { createDomainErrorHelpersWithFields } from '@/shared/domain/domain-errors';

// Rolling plan version-specific error configuration
// Currently no domain-specific errors defined
const ROLLING_PLAN_VERSION_ERROR_CONFIG = {} as const;

// Generate error helpers automatically
const baseRollingPlanVersionErrors = createDomainErrorHelpersWithFields(
  ROLLING_PLAN_VERSION_ERROR_CONFIG,
);

/**
 * Helper functions to add rolling plan version-specific errors to collector
 */
export const rollingPlanVersionErrors = {
  // Use generated helpers for base rolling plan version errors
  ...baseRollingPlanVersionErrors,
};
