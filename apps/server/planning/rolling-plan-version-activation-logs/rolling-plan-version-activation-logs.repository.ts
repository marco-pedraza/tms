import { db } from '@/planning/db-service';
import { type OrderBy, createBaseRepository } from '@repo/base-repo';
import { rollingPlanVersionActivationLogs } from './rolling-plan-version-activation-logs.schema';
import type {
  PaginatedListRollingPlanVersionActivationLogsQueryParams,
  PaginatedRollingPlanVersionActivationLogsResult,
  RollingPlanVersionActivationLog,
} from './rolling-plan-version-activation-logs.types';

/**
 * Creates a repository for managing rolling plan version activation logs
 */
export function createRollingPlanVersionActivationLogRepository() {
  const baseRepository = createBaseRepository<
    RollingPlanVersionActivationLog,
    never, // No create payload - logs are created by the system
    never, // No update payload - logs are immutable
    typeof rollingPlanVersionActivationLogs
  >(db, rollingPlanVersionActivationLogs, 'RollingPlanVersionActivationLog', {
    searchableFields: [], // No searchable fields for activation logs
    softDeleteEnabled: false, // Activation logs are never deleted
  });

  /**
   * Transforms raw log data to include calculated metrics
   * @param log - Raw log data from database
   * @returns Log with calculated duration and isActive fields
   */
  function transformLog(
    log: typeof rollingPlanVersionActivationLogs.$inferSelect,
  ): RollingPlanVersionActivationLog {
    // activatedAt is notNull in schema, so it's always present
    const activatedAt = new Date(log.activatedAt);
    const deactivatedAt = log.deactivatedAt
      ? new Date(log.deactivatedAt)
      : null;

    // Calculate duration in milliseconds
    const duration = deactivatedAt
      ? deactivatedAt.getTime() - activatedAt.getTime()
      : null;

    // Check if currently active (deactivatedAt is null)
    const isActive = deactivatedAt === null;

    return {
      id: log.id,
      versionId: log.versionId,
      rollingPlanId: log.rollingPlanId,
      activatedAt: log.activatedAt,
      deactivatedAt: log.deactivatedAt,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
      duration,
      isActive,
    };
  }

  /**
   * Finds activation logs for a specific rolling plan version with pagination
   * Ordered by activation date descending (most recent first)
   * @param versionId - The ID of the rolling plan version
   * @param params - Pagination and query parameters
   * @returns Paginated result with activation logs and pagination metadata
   */
  async function findByVersionIdPaginated(
    versionId: number,
    params: PaginatedListRollingPlanVersionActivationLogsQueryParams,
  ): Promise<PaginatedRollingPlanVersionActivationLogsResult> {
    // Use base repository's findAllPaginated with versionId filter
    // Default orderBy to activatedAt descending if not specified
    const defaultOrderBy = [
      { field: 'activatedAt' as const, direction: 'desc' as const },
    ];
    const orderBy = params.orderBy || defaultOrderBy;

    const result = await baseRepository.findAllPaginated({
      page: params.page,
      pageSize: params.pageSize,
      filters: {
        ...params.filters,
        versionId,
      },
      orderBy: orderBy as OrderBy<typeof rollingPlanVersionActivationLogs>,
    });

    // Transform logs to include calculated metrics
    // Cast to schema type since findAllPaginated returns raw schema data
    const transformedLogs = (
      result.data as unknown as (typeof rollingPlanVersionActivationLogs.$inferSelect)[]
    ).map(transformLog);

    return {
      data: transformedLogs,
      pagination: result.pagination,
    };
  }

  return {
    ...baseRepository,
    findByVersionIdPaginated,
  };
}

// Export the rolling plan version activation log repository instance
export const rollingPlanVersionActivationLogRepository =
  createRollingPlanVersionActivationLogRepository();
