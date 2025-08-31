import type {
  CreatePathwayOptionPayload,
  PathwayOption,
  UpdatePathwayOptionPayload,
} from '@/inventory/routing/pathway-options/pathway-options.types';
import type {
  CreatePathwayPayload,
  Pathway,
  UpdatePathwayPayload,
} from '@/inventory/routing/pathways/pathways.types';

// =============================================================================
// GENERIC UTILITY TYPES - Reusable patterns for other entities
// =============================================================================

/**
 * Base interface for domain entities that need persistence tracking
 * Only includes universal properties that apply to most domain entities
 * @template TEntity - The specific entity type (e.g., Pathway, Route, etc.)
 * @template TUpdatePayload - The payload type for updates
 */
export interface BaseEntity<TEntity, TUpdatePayload> {
  /** ID (optional if not persisted yet) */
  id?: number;

  /** Whether this entity has been persisted to the database */
  isPersisted: boolean;

  /**
   * Saves the entity to the database if not already persisted
   * @returns A new entity instance with the persisted data
   */
  save: () => Promise<TEntity>;

  /**
   * Updates the entity (only available for persisted entities)
   * @param payload - Update data
   * @returns A new entity instance with updated data
   * @throws {NotFoundError} If the entity is not found
   */
  update: (payload: TUpdatePayload) => Promise<TEntity>;
}

// =============================================================================
// PATHWAY-SPECIFIC TYPES
// =============================================================================

/**
 * Payload for adding options to a pathway
 * Excludes pathwayId (set automatically) and isDefault (managed by business rules)
 */
export type AddPathwayOptionPayload = Omit<
  CreatePathwayOptionPayload,
  'pathwayId' | 'isDefault'
>;

/**
 * Payload for updating pathway options
 * Excludes pathwayId (immutable) and isDefault (managed by business rules)
 */
export type UpdatePathwayOptionPayloadClean = Omit<
  UpdatePathwayOptionPayload,
  'pathwayId' | 'isDefault'
>;

/**
 * Dependencies interface for pathway entity factory function
 * Defines the repository contracts needed for pathway entity operations
 */
export interface PathwayEntityDependencies {
  pathwaysRepository: {
    create: (
      payload: CreatePathwayPayload & {
        originCityId: number;
        destinationCityId: number;
      },
    ) => Promise<Pathway>;
    update: (id: number, payload: UpdatePathwayPayload) => Promise<Pathway>;
    findOne: (id: number) => Promise<Pathway>; // Throws NotFoundError if not found
  };
  pathwayOptionsRepository: {
    findByPathwayId: (pathwayId: number) => Promise<PathwayOption[]>;
    create: (payload: CreatePathwayOptionPayload) => Promise<PathwayOption>;
    update: (
      id: number,
      payload: UpdatePathwayOptionPayload,
    ) => Promise<PathwayOption>;
    findOne: (id: number) => Promise<PathwayOption>; // Throws NotFoundError if not found
    delete: (id: number) => Promise<PathwayOption | null>; // Allow null return type
  };
  nodesRepository: {
    findOne: (id: number) => Promise<{ id: number; cityId: number }>;
  };
}

/**
 * Pathway entity with domain behavior
 * Extends all pathway properties for direct access (e.g., instance.name instead of instance.data.name)
 */
export interface PathwayEntity
  extends Omit<Pathway, 'id'>,
    BaseEntity<PathwayEntity, UpdatePathwayPayload> {
  /** Associated pathway options (lazy-loaded) */
  options: Promise<PathwayOption[]>;

  /**
   * Extracts plain pathway data from the entity
   * @returns Plain pathway object without entity methods
   */
  toPathway: () => Pathway;

  /**
   * Adds an option to this pathway
   * @param optionData - Option data (pathwayId and isDefault are set automatically)
   * @returns A new PathwayEntity instance with the added option
   * @throws {FieldValidationError} If validation fails
   * @throws {ValidationError} If pathway is not persisted
   */
  addOption: (optionData: AddPathwayOptionPayload) => Promise<PathwayEntity>;

  /**
   * Removes an option from this pathway
   * @param optionId - The ID of the option to remove
   * @returns A new PathwayEntity instance without the removed option
   * @throws {NotFoundError} If option is not found
   * @throws {ValidationError} If option doesn't belong to this pathway
   * @throws {FieldValidationError} If trying to remove default option or last option from active pathway
   */
  removeOption: (optionId: number) => Promise<PathwayEntity>;

  /**
   * Updates an existing option
   * @param optionId - The ID of the option to update
   * @param optionData - Option update data (isDefault and pathwayId are managed separately)
   * @returns A new PathwayEntity instance with updated option
   * @throws {NotFoundError} If option is not found
   * @throws {ValidationError} If option doesn't belong to this pathway
   */
  updateOption: (
    optionId: number,
    optionData: UpdatePathwayOptionPayloadClean,
  ) => Promise<PathwayEntity>;

  /**
   * Sets an option as the default option (future implementation)
   * Only one option can be default per pathway
   * @param optionId - The ID of the option to set as default
   * @returns A new PathwayEntity instance with updated default option
   * @throws {NotFoundError} If option is not found
   * @throws {ValidationError} If option doesn't belong to this pathway
   */
  // setDefaultOption: (optionId: number) => Promise<PathwayEntity>;
}
