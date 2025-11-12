import { api } from 'encore.dev/api';
import { rollingPlanRepository } from '@/planning/rolling-plans/rolling-plans.repository';
import { NotFoundError } from '@/shared/errors';
import type {
  ListRollingPlanVersionsQueryParams,
  ListRollingPlanVersionsResult,
  RollingPlanVersion,
} from './rolling-plan-versions.types';
import { rollingPlanVersionRepository } from './rolling-plan-versions.repository';

/**
 * Retrieves a rolling plan version by its ID within a specific rolling plan.
 * @param params - Object containing the rolling plan ID and version ID
 * @param params.id - The ID of the rolling plan
 * @param params.versionId - The ID of the rolling plan version to retrieve
 * @returns {Promise<RollingPlanVersion>} The found rolling plan version
 * @throws {NotFoundError} If the rolling plan or version is not found
 * @throws {APIError} If retrieval fails
 */
export const getRollingPlanVersion = api(
  {
    expose: true,
    method: 'GET',
    path: '/rolling-plans/:id/versions/:versionId',
    auth: true,
  },
  async ({
    id,
    versionId,
  }: {
    id: number;
    versionId: number;
  }): Promise<RollingPlanVersion> => {
    // Validate that the rolling plan exists
    await rollingPlanRepository.findOne(id);

    const version = await rollingPlanVersionRepository.findOne(versionId);

    // Validate that the version belongs to the rolling plan
    if (version.rollingPlanId !== id) {
      throw new NotFoundError(
        `Rolling plan version ${versionId} not found for rolling plan ${id}`,
      );
    }

    return version;
  },
);

/**
 * Retrieves all rolling plan versions for a specific rolling plan without pagination.
 * @param params - Object containing the rolling plan ID and query parameters
 * @param params.id - The ID of the rolling plan to get versions for
 * @param params.orderBy - Optional ordering configuration
 * @param params.filters - Optional filters to apply
 * @param params.searchTerm - Optional search term to match against version names
 * @returns {Promise<ListRollingPlanVersionsResult>} Unified response with data property containing array of rolling plan versions
 * @throws {NotFoundError} If the rolling plan is not found
 * @throws {APIError} If retrieval fails
 */
export const listRollingPlanVersions = api(
  {
    expose: true,
    method: 'POST',
    path: '/rolling-plans/:id/versions',
    auth: true,
  },
  async ({
    id,
    ...queryParams
  }: {
    id: number;
  } & ListRollingPlanVersionsQueryParams): Promise<ListRollingPlanVersionsResult> => {
    // Validate that the rolling plan exists
    await rollingPlanRepository.findOne(id);

    const versions = await rollingPlanVersionRepository.findAllByRollingPlanId(
      id,
      queryParams,
    );
    return {
      data: versions,
    };
  },
);
