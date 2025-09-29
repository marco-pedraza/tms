import type { BaseDomainEntity } from '@/shared/domain/base-entity';
import type {
  CreatePathwayOptionPayload,
  PathwayOption,
  UpdatePathwayOptionPayload,
} from './pathway-options.types';

// =============================================================================
// PATHWAY OPTION SPECIFIC TYPES
// =============================================================================

/**
 * Input for metrics calculation - exactly 2 of 3 values must be provided
 */
export interface MetricsCalculationInput {
  distanceKm: number | null;
  typicalTimeMin: number | null;
  avgSpeedKmh: number | null;
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
}
