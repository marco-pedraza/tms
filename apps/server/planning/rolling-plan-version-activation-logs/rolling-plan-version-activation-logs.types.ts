import type {
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '@/shared/types';

/**
 * Activation log entry with calculated metrics
 */
export interface RollingPlanVersionActivationLog {
  /** Unique identifier for the activation log */
  id: number;

  /** ID of the rolling plan version */
  versionId: number;

  /** ID of the rolling plan */
  rollingPlanId: number;

  /** Timestamp when the version was activated */
  activatedAt: Date | string;

  /** Timestamp when the version was deactivated (null if still active) */
  deactivatedAt: Date | string | null;

  /** Timestamp when the log record was created */
  createdAt: Date | string | null;

  /** Timestamp when the log record was last updated */
  updatedAt: Date | string | null;

  /** Duration in milliseconds (null if still active) */
  duration: number | null;

  /** Whether this activation period is currently active */
  isActive: boolean;
}

/**
 * Query parameters for listing activation logs with pagination
 */
export type PaginatedListRollingPlanVersionActivationLogsQueryParams =
  PaginatedListQueryParams<RollingPlanVersionActivationLog>;

/**
 * Result for paginated activation logs query
 */
export type PaginatedRollingPlanVersionActivationLogsResult =
  PaginatedListQueryResult<RollingPlanVersionActivationLog>;
