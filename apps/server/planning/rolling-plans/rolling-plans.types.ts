import { MatchesRegexp, Min, MinLen } from 'encore.dev/validate';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '@/shared/types';
import { BusModel } from '@/inventory/fleet/bus-models/bus-models.types';
import { Node } from '@/inventory/locations/nodes/nodes.types';
import { BusLine } from '@/inventory/operators/bus-lines/bus-lines.types';
import { ServiceType } from '@/inventory/operators/service-types/service-types.types';

/**
 * Operation type for rolling plans
 */
export type RollingPlanOperationType = 'continuous' | 'specific_days';

/**
 * Base interface representing a rolling plan entity
 */
export interface RollingPlan {
  /** Unique identifier for the rolling plan */
  id: number;

  /** Name of the rolling plan */
  name: string;

  /** ID of the bus line this rolling plan belongs to */
  buslineId: number;

  /** ID of the service type */
  serviceTypeId: number;

  /** ID of the bus model */
  busModelId: number;

  /** ID of the base node */
  baseNodeId: number;

  /** Operation type: 'continuous' or 'specific_days' */
  operationType: RollingPlanOperationType;

  /** Cycle duration in days (nullable, used for continuous operation) */
  cycleDurationDays: number | null;

  /**
   * Operation days configuration (nullable, used for specific_days operation)
   * Stored as JSONB in the database
   */
  operationDays: Record<string, unknown> | null;

  /** Whether the rolling plan is currently active */
  active: boolean;

  /** Optional notes about the rolling plan */
  notes: string | null;

  /** Timestamp when the rolling plan record was created */
  createdAt: Date | string | null;

  /** Timestamp when the rolling plan record was last updated */
  updatedAt: Date | string | null;
}

/**
 * Rolling plan with all related entities
 */
export interface RollingPlanWithRelations extends RollingPlan {
  busline: BusLine;
  serviceType: ServiceType;
  busModel: BusModel;
  baseNode: Node;
}

/**
 * Input for creating a new rolling plan
 */
export interface CreateRollingPlanPayload {
  /**
   * The name of the rolling plan
   * Must have at least 1 non-whitespace character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * ID of the bus line this rolling plan belongs to
   * Must be a positive number
   */
  buslineId: number & Min<1>;

  /**
   * ID of the service type
   * Must be a positive number
   */
  serviceTypeId: number & Min<1>;

  /**
   * ID of the bus model
   * Must be a positive number
   */
  busModelId: number & Min<1>;

  /**
   * ID of the base node
   * Must be a positive number
   */
  baseNodeId: number & Min<1>;

  /**
   * Operation type
   * Must be either 'continuous' or 'specific_days'
   */
  operationType: RollingPlanOperationType;

  /**
   * Cycle duration in days (required for continuous operation)
   */
  cycleDurationDays?: number & Min<1>;

  /**
   * Operation days configuration (required for specific_days operation)
   * Stored as JSONB in the database
   */
  operationDays?: Record<string, unknown>;

  /**
   * Whether the rolling plan is active
   * @default true
   */
  active?: boolean;

  /**
   * Optional notes about the rolling plan
   */
  notes?: string;
}

/**
 * Input for updating a rolling plan
 */
export interface UpdateRollingPlanPayload {
  /**
   * The name of the rolling plan
   * Must have at least 1 non-whitespace character
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * ID of the bus line this rolling plan belongs to
   * Must be a positive number
   */
  buslineId?: number & Min<1>;

  /**
   * ID of the service type
   * Must be a positive number
   */
  serviceTypeId?: number & Min<1>;

  /**
   * ID of the bus model
   * Must be a positive number
   */
  busModelId?: number & Min<1>;

  /**
   * ID of the base node
   * Must be a positive number
   */
  baseNodeId?: number & Min<1>;

  /**
   * Operation type
   * Must be either 'continuous' or 'specific_days'
   */
  operationType?: RollingPlanOperationType;

  /**
   * Cycle duration in days (for continuous operation)
   */
  cycleDurationDays?: (number & Min<1>) | null;

  /**
   * Operation days configuration (for specific_days operation)
   * Stored as JSONB in the database
   */
  operationDays?: Record<string, unknown> | null;

  /**
   * Whether the rolling plan is active
   */
  active?: boolean;

  /**
   * Optional notes about the rolling plan
   */
  notes?: string | null;
}

/**
 * Unified list query parameters for rolling plans (non-paginated)
 */
export type ListRollingPlansQueryParams = ListQueryParams<RollingPlan>;

/**
 * Unified list result for rolling plans (non-paginated)
 */
export type ListRollingPlansResult = ListQueryResult<RollingPlan>;

/**
 * Unified paginated list query parameters for rolling plans
 */
export type PaginatedListRollingPlansQueryParams =
  PaginatedListQueryParams<RollingPlan>;

/**
 * Unified paginated list result for rolling plans
 */
export type PaginatedListRollingPlansResult =
  PaginatedListQueryResult<RollingPlanWithRelations>;
