import { MatchesRegexp, Min, MinLen } from 'encore.dev/validate';
import type {
  PlanningBusLine,
  PlanningBusModel,
  PlanningNode,
} from '@/planning/adapters/inventory.adapter';
import type { TableColumn, TransactionalDB } from '@repo/base-repo';
import type { BaseDomainEntity } from '@/shared/domain/base-entity';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '@/shared/types';
import type { rollingPlans } from './rolling-plans.schema';

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
 * Rolling plan with all related entities (using planning-specific types)
 */
export interface RollingPlanWithRelations extends RollingPlan {
  busline: PlanningBusLine;
  busModel: PlanningBusModel;
  baseNode: PlanningNode;
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

// =============================================================================
// ROLLING PLAN ENTITY DEPENDENCIES AND INTERFACE
// =============================================================================

/**
 * Rolling plan entity with domain behavior
 * Extends all rolling plan properties for direct access (e.g., instance.name instead of instance.data.name)
 */
export interface RollingPlanEntity
  extends Omit<RollingPlan, 'id'>,
    Omit<
      BaseDomainEntity<RollingPlanEntity, UpdateRollingPlanPayload>,
      'save' | 'update'
    > {
  /**
   * Extracts plain rolling plan data from the entity
   * @returns Plain rolling plan object without entity methods
   */
  toRollingPlan: () => RollingPlan;

  /**
   * Saves the rolling plan to the database
   * @param tx - Database transaction instance (required)
   * @returns The saved rolling plan entity
   */
  save(tx: TransactionalDB): Promise<RollingPlanEntity>;

  /**
   * Updates the rolling plan in the database
   * @param payload - The update data
   * @param tx - Database transaction instance (required)
   * @returns The updated rolling plan entity
   */
  update(
    payload: UpdateRollingPlanPayload,
    tx: TransactionalDB,
  ): Promise<RollingPlanEntity>;
}

/**
 * Dependencies required by the rolling plan entity
 */
export interface RollingPlanEntityDependencies {
  rollingPlansRepository: {
    create: (
      payload: CreateRollingPlanPayload,
      tx?: TransactionalDB,
    ) => Promise<RollingPlan>;
    update: (
      id: number,
      payload: UpdateRollingPlanPayload,
      tx?: TransactionalDB,
    ) => Promise<RollingPlan>;
    findOne: (id: number, tx?: TransactionalDB) => Promise<RollingPlan>; // Throws NotFoundError if not found
    checkUniqueness: (
      fields: {
        field: TableColumn<typeof rollingPlans>;
        value: unknown;
        scope?: { field: TableColumn<typeof rollingPlans>; value: unknown };
      }[],
      excludeId?: number,
    ) => Promise<
      {
        field: string;
        value: unknown;
      }[]
    >;
  };
  inventoryAdapter: {
    getBusLine: (id: number) => Promise<PlanningBusLine>;
    getBusModel: (id: number) => Promise<PlanningBusModel>;
    getNode: (id: number) => Promise<PlanningNode>;
  };
}
