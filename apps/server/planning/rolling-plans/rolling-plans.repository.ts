import { db } from '@/planning/db-service';
import { createBaseRepository } from '@repo/base-repo';
import { rollingPlans } from './rolling-plans.schema';
import type {
  CreateRollingPlanPayload,
  RollingPlan,
  UpdateRollingPlanPayload,
} from './rolling-plans.types';

/**
 * Creates a repository for managing rolling plan entities
 */
export function createRollingPlanRepository() {
  const baseRepository = createBaseRepository<
    RollingPlan,
    CreateRollingPlanPayload,
    UpdateRollingPlanPayload,
    typeof rollingPlans
  >(db, rollingPlans, 'Rolling Plan', {
    searchableFields: [rollingPlans.name],
    softDeleteEnabled: true,
  });

  return {
    ...baseRepository,
  };
}

// Export the rolling plan repository instance
export const rollingPlanRepository = createRollingPlanRepository();
