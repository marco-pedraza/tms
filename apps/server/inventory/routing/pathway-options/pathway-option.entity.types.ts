import { TransactionalDB } from '@repo/base-repo';
import type { BaseDomainEntity } from '@/shared/domain/base-entity';
import type { TollboothRepository } from '@/inventory/locations/tollbooths/tollbooths.types';
import type {
  CreatePathwayOptionTollPayload,
  PathwayOptionToll,
  SyncTollsInput,
} from '@/inventory/routing/pathway-options-tolls/pathway-options-tolls.types';
import type {
  CreatePathwayOptionPayload,
  PathwayOption,
  UpdatePathwayOptionPayload,
} from './pathway-options.types';

// =============================================================================
// PATHWAY OPTION SPECIFIC TYPES
// =============================================================================

/**
 * Input for metrics calculation - distance and time are both required
 */
export interface MetricsCalculationInput {
  distanceKm: number;
  typicalTimeMin: number;
}

/**
 * Result of metrics calculation - all 3 values calculated
 */
export interface MetricsCalculationResult {
  distanceKm: number;
  typicalTimeMin: number;
  avgSpeedKmh: number;
}

/**
 * Dependencies interface for pathway option entity factory function
 * Defines the repository contracts needed for pathway option entity operations
 */
export interface PathwayOptionEntityDependencies {
  pathwayOptionsRepository: {
    create: (payload: CreatePathwayOptionPayload) => Promise<PathwayOption>;
    update: (
      id: number,
      payload: UpdatePathwayOptionPayload,
    ) => Promise<PathwayOption>;
    findOne: (id: number) => Promise<PathwayOption>; // Throws NotFoundError if not found
    delete: (id: number) => Promise<PathwayOption>; // Throws NotFoundError if not found
  };
  pathwayOptionTollsRepository: {
    findByOptionId: (optionId: number) => Promise<PathwayOptionToll[]>;
    deleteByOptionId: (optionId: number) => Promise<void>;
    createMany: (
      tolls: CreatePathwayOptionTollPayload[],
    ) => Promise<PathwayOptionToll[]>;
    updateMany: (
      updates: { id: number; passTimeMin: number }[],
    ) => Promise<void>;
  };
  nodesRepository: {
    findOne: (id: number) => Promise<{ id: number }>;
    findByIds: (
      ids: number[],
      tx?: TransactionalDB,
    ) => Promise<{ id: number }[]>;
  };
  tollboothRepository: TollboothRepository;
}

/**
 * PathwayOption entity with domain behavior
 * Extends all pathway option properties for direct access (e.g., instance.name instead of instance.data.name)
 */
export interface PathwayOptionEntity
  extends Omit<PathwayOption, 'id'>,
    BaseDomainEntity<PathwayOptionEntity, UpdatePathwayOptionPayload> {
  /**
   * Extracts plain pathway option data from the entity
   * @returns Plain pathway option object without entity methods
   * @throws {Error} If entity is not persisted (missing id)
   */
  toPathwayOption: () => PathwayOption;

  /**
   * Synchronizes tolls for this pathway option (destructive operation)
   * Deletes all existing tolls and creates new ones with auto-assigned sequence (1..N)
   * @param tollsInput - Array of toll data (sequence assigned automatically)
   * @returns A new PathwayOptionEntity instance after sync
   * @throws {FieldValidationError} If toll validation fails
   * @throws {Error} If entity is not persisted
   */
  syncTolls: (tollsInput: SyncTollsInput[]) => Promise<PathwayOptionEntity>;

  /**
   * Gets all tolls for this pathway option ordered by sequence
   * @returns Array of pathway option tolls
   * @throws {Error} If entity is not persisted
   */
  getTolls: () => Promise<PathwayOptionToll[]>;
}
