import { MatchesRegexp, Min, MinLen } from 'encore.dev/validate';
import type { TableColumn, TransactionalDB } from '@repo/base-repo';
import type { BaseDomainEntity } from '@/shared/domain/base-entity';
import type { ListQueryParams, ListQueryResult } from '@/shared/types';
import type { rollingPlanVersions } from './rolling-plan-versions.schema';

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
 * Note: state is always set to 'draft' on creation and cannot be specified
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
   * Optional notes about the version
   */
  notes?: string;
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

// =============================================================================
// ROLLING PLAN VERSION ENTITY DEPENDENCIES AND INTERFACE
// =============================================================================

/**
 * Rolling plan version entity with domain behavior
 * Extends all rolling plan version properties for direct access (e.g., instance.name instead of instance.data.name)
 */
export interface RollingPlanVersionEntity
  extends Omit<RollingPlanVersion, 'id'>,
    Omit<
      BaseDomainEntity<
        RollingPlanVersionEntity,
        UpdateRollingPlanVersionPayload
      >,
      'save' | 'update'
    > {
  /**
   * Extracts plain rolling plan version data from the entity
   * @returns Plain rolling plan version object without entity methods
   */
  toRollingPlanVersion: () => RollingPlanVersion;

  /**
   * Saves the rolling plan version to the database
   * @param tx - Database transaction instance (required)
   * @returns The saved rolling plan version entity
   */
  save(tx: TransactionalDB): Promise<RollingPlanVersionEntity>;

  /**
   * Updates the rolling plan version in the database
   * @param payload - The update data
   * @param tx - Database transaction instance (required)
   * @returns The updated rolling plan version entity
   */
  update(
    payload: UpdateRollingPlanVersionPayload,
    tx: TransactionalDB,
  ): Promise<RollingPlanVersionEntity>;
}

/**
 * Dependencies required by the rolling plan version entity
 */
export interface RollingPlanVersionEntityDependencies {
  rollingPlanVersionsRepository: {
    create: (
      payload: CreateRollingPlanVersionPayload,
      tx?: TransactionalDB,
    ) => Promise<RollingPlanVersion>;
    findOne: (id: number, tx?: TransactionalDB) => Promise<RollingPlanVersion>; // Throws NotFoundError if not found
    checkUniqueness: (
      fields: {
        field: TableColumn<typeof rollingPlanVersions>;
        value: unknown;
        scope?: {
          field: TableColumn<typeof rollingPlanVersions>;
          value: unknown;
        };
      }[],
      excludeId?: number,
    ) => Promise<
      {
        field: string;
        value: unknown;
      }[]
    >;
  };
}
