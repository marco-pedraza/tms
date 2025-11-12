import { MatchesRegexp, Min, MinLen } from 'encore.dev/validate';
import type { ListQueryParams, ListQueryResult } from '@/shared/types';

/**
 * State type for rolling plan versions
 */
export type RollingPlanVersionState = 'draft' | 'active' | 'inactive';

/**
 * Base interface representing a rolling plan version entity
 */
export interface RollingPlanVersion {
  /** Unique identifier for the rolling plan version */
  id: number;

  /** ID of the rolling plan this version belongs to */
  rollingPlanId: number;

  /** Name of the rolling plan version */
  name: string;

  /** State of the version: 'draft' | 'active' | 'inactive' */
  state: RollingPlanVersionState;

  /** Optional notes about the version */
  notes: string | null;

  /** Timestamp when the version was activated */
  activatedAt: Date | string | null;

  /** Timestamp when the version was deactivated */
  deactivatedAt: Date | string | null;

  /** Timestamp when the version record was created */
  createdAt: Date | string | null;

  /** Timestamp when the version record was last updated */
  updatedAt: Date | string | null;
}

/**
 * Input for creating a new rolling plan version
 */
export interface CreateRollingPlanVersionPayload {
  /**
   * ID of the rolling plan this version belongs to
   * Must be a positive number
   */
  rollingPlanId: number & Min<1>;

  /**
   * The name of the rolling plan version
   * Must have at least 1 non-whitespace character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * State of the version
   * Must be either 'draft', 'active', or 'inactive'
   */
  state: RollingPlanVersionState;

  /**
   * Optional notes about the version
   */
  notes?: string;

  /**
   * Timestamp when the version was activated
   */
  activatedAt?: Date;

  /**
   * Timestamp when the version was deactivated
   */
  deactivatedAt?: Date;
}

/**
 * Input for updating a rolling plan version
 */
export interface UpdateRollingPlanVersionPayload {
  /**
   * ID of the rolling plan this version belongs to
   * Must be a positive number
   */
  rollingPlanId?: number & Min<1>;

  /**
   * The name of the rolling plan version
   * Must have at least 1 non-whitespace character
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * State of the version
   * Must be either 'draft', 'active', or 'inactive'
   */
  state?: RollingPlanVersionState;

  /**
   * Optional notes about the version
   */
  notes?: string | null;

  /**
   * Timestamp when the version was activated
   */
  activatedAt?: Date | null;

  /**
   * Timestamp when the version was deactivated
   */
  deactivatedAt?: Date | null;
}

/**
 * Unified list query parameters for rolling plan versions (non-paginated)
 */
export type ListRollingPlanVersionsQueryParams =
  ListQueryParams<RollingPlanVersion>;

/**
 * Unified list result for rolling plan versions (non-paginated)
 */
export type ListRollingPlanVersionsResult = ListQueryResult<RollingPlanVersion>;
