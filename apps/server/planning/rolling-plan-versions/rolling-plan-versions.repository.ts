import { db } from '@/planning/db-service';
import { createBaseRepository } from '@repo/base-repo';
import { rollingPlanVersions } from './rolling-plan-versions.schema';
import type {
  CreateRollingPlanVersionPayload,
  RollingPlanVersion,
  UpdateRollingPlanVersionPayload,
} from './rolling-plan-versions.types';

/**
 * Creates a repository for managing rolling plan version entities
 */
export function createRollingPlanVersionRepository() {
  const baseRepository = createBaseRepository<
    RollingPlanVersion,
    CreateRollingPlanVersionPayload,
    UpdateRollingPlanVersionPayload,
    typeof rollingPlanVersions
  >(db, rollingPlanVersions, 'Rolling Plan Version', {
    searchableFields: [rollingPlanVersions.name],
    softDeleteEnabled: true,
  });

  /**
   * Finds all rolling plan versions for a specific rolling plan
   * Supports filtering, ordering, and search
   * @param rollingPlanId - The ID of the rolling plan
   * @param options - Optional query options for ordering, filtering, and search
   * @returns Array of rolling plan versions
   */
  async function findAllByRollingPlanId(
    rollingPlanId: number,
    options?: {
      orderBy?: {
        field: keyof RollingPlanVersion;
        direction: 'asc' | 'desc';
      }[];
      filters?: Partial<RollingPlanVersion>;
      searchTerm?: string;
    },
  ): Promise<RollingPlanVersion[]> {
    // Default ordering by creation date descending if not specified
    const orderBy = options?.orderBy ?? [
      { field: 'createdAt', direction: 'desc' },
    ];

    return await baseRepository.findAllBy(
      rollingPlanVersions.rollingPlanId,
      rollingPlanId,
      {
        orderBy,
        filters: options?.filters,
        searchTerm: options?.searchTerm,
      },
    );
  }

  return {
    ...baseRepository,
    findAllByRollingPlanId,
  };
}

// Export the rolling plan version repository instance
export const rollingPlanVersionRepository =
  createRollingPlanVersionRepository();
