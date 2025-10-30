import { MatchesRegexp, Min, MinLen } from 'encore.dev/validate';
import type { BaseDomainEntity } from '@/shared/domain/base-entity';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '@/shared/types';
import { Node } from '@/inventory/locations/nodes/nodes.types';
import type {
  PathwayOptionToll,
  SyncTollsInput,
} from '@/inventory/routing/pathway-options-tolls/pathway-options-tolls.types';
import type { PathwayOptionEntity } from '@/inventory/routing/pathway-options/pathway-option.entity.types';
import type {
  CreatePathwayOptionPayload,
  PathwayOption,
  UpdatePathwayOptionPayload,
} from '@/inventory/routing/pathway-options/pathway-options.types';

/**
 * Base interface representing a pathway entity
 */
export interface Pathway {
  /** Unique identifier for the pathway */
  id: number;

  /** ID of the origin node */
  originNodeId: number;

  /** ID of the destination node */
  destinationNodeId: number;

  /** ID of the origin city */
  originCityId: number;

  /** ID of the destination city */
  destinationCityId: number;

  /** Name of the pathway */
  name: string;

  /** Code of the pathway */
  code: string;

  /** Description of the pathway */
  description: string | null;

  /** Whether the pathway is sellable */
  isSellable: boolean;

  /** Whether the pathway is an empty trip */
  isEmptyTrip: boolean;

  /** Whether the pathway is active */
  active: boolean;

  /** Timestamp when the pathway was created */
  createdAt: Date | string | null;

  /** Timestamp when the pathway was last updated */
  updatedAt: Date | string | null;

  /** Timestamp when the pathway was deleted */
  deletedAt: Date | string | null;
}

/**
 * Interface for a pathway option with tolls
 */
export interface PathwayOptionWithTolls extends PathwayOption {
  tolls: PathwayOptionToll[];
}

/**
 * Interface for a pathway with relations
 */
export interface PathwayWithRelations extends Pathway {
  origin: Node;
  destination: Node;
  options?: PathwayOptionWithTolls[];
}

/**
 * Interface for creating a new pathway
 */
export interface CreatePathwayPayload {
  /**
   * ID of the origin node
   * Must be a positive number
   */
  originNodeId: number & Min<1>;

  /**
   * ID of the destination node
   * Must be a positive number
   */
  destinationNodeId: number & Min<1>;

  /**
   * Name of the pathway
   * Must have at least 1 character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Code of the pathway
   * Must have at least 1 character
   */
  code: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Description of the pathway
   */
  description?: string | null;

  /**
   * Whether the pathway is sellable
   */
  isSellable?: boolean;

  /**
   * Whether the pathway is an empty trip
   */
  isEmptyTrip?: boolean;

  /**
   * Whether the pathway is active
   */
  active?: boolean;
}

/**
 * Interface for updating a pathway
 */
export interface UpdatePathwayPayload {
  /**
   * ID of the origin node
   */
  originNodeId?: number & Min<1>;

  /**
   * ID of the destination node
   */
  destinationNodeId?: number & Min<1>;

  /**
   * Name of the pathway
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Code of the pathway
   */
  code?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Description of the pathway
   */
  description?: string | null;

  /**
   * Whether the pathway is sellable
   */
  isSellable?: boolean;

  /**
   * Whether the pathway is an empty trip
   */
  isEmptyTrip?: boolean;

  /**
   * Whether the pathway is active
   */
  active?: boolean;
}

export type ListPathwaysQueryParams = ListQueryParams<Pathway>;
export type ListPathwaysResult = ListQueryResult<Pathway>;

export type PaginatedListPathwaysQueryParams =
  PaginatedListQueryParams<Pathway>;
export type PaginatedListPathwaysResult =
  PaginatedListQueryResult<PathwayWithRelations>;

// =============================================================================
// DOMAIN ENTITY TYPES
// =============================================================================

/**
 * Payload for adding options to a pathway
 * Excludes pathwayId (set automatically)
 * isDefault is optional - if not provided, first option becomes default automatically
 */
export type AddPathwayOptionPayload = Omit<
  CreatePathwayOptionPayload,
  'pathwayId'
> & {
  /**
   * Whether this option should be the default
   * Optional - if not provided:
   * - First option: becomes default automatically
   * - Subsequent options: NOT default
   */
  isDefault?: boolean;
};

/**
 * Payload for updating pathway options
 * Excludes pathwayId (immutable) and isDefault (managed by business rules)
 */
export type UpdatePathwayOptionPayloadClean = Omit<
  UpdatePathwayOptionPayload,
  'pathwayId' | 'isDefault'
>;

// =============================================================================
// BULK SYNC TYPES
// =============================================================================

/**
 * Input for a single option in bulk sync operation (API type)
 * Does not include tempId (internal implementation detail)
 */
export interface BulkSyncOptionInput {
  /** ID of existing option (omit for new options) */
  id?: number;

  /** Name of the option */
  name: string;

  /** Description of the option */
  description?: string | null;

  /** Distance in kilometers */
  distanceKm: number;

  /** Typical time in minutes */
  typicalTimeMin: number;

  /** Average speed in km/h (calculated automatically if not provided) */
  avgSpeedKmh?: number;

  /** Whether this is a pass-through option */
  isPassThrough: boolean;

  /** Pass-through time in minutes (required if isPassThrough is true) */
  passThroughTimeMin?: number | null;

  /** Sequence number for ordering */
  sequence?: number | null;

  /** Whether the option is active */
  active: boolean;

  /** Whether this option should be the default */
  isDefault?: boolean;

  /** Optional array of tolls for this option */
  tolls?: SyncTollsInput[];
}

/**
 * Internal type with tempId for tracking new options during bulk sync
 * Used internally to map newly created options to their tolls
 */
export interface BulkSyncOptionInputInternal extends BulkSyncOptionInput {
  /** Temporary ID for new options (used internally to map tolls) */
  tempId?: number;
}

/**
 * Payload for bulk sync operation
 */
export interface BulkSyncOptionsPayload {
  /** Array of options to sync (creates, updates, deletes determined by presence of id) */
  options: BulkSyncOptionInput[];
}

/**
 * Result of categorizing bulk sync operations
 */
export interface CategorizedOperations {
  /** Options to create (with tempId for internal tracking) */
  toCreate: [number, BulkSyncOptionInputInternal][];

  /** Options to update */
  toUpdate: BulkSyncOptionInputInternal[];

  /** Options to delete (current options not in payload) */
  toDelete: PathwayOption[];
}

// =============================================================================
// PATHWAY ENTITY DEPENDENCIES AND INTERFACE
// =============================================================================

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
    delete: (id: number) => Promise<PathwayOption>; // Throws NotFoundError if not found
    setDefaultOption: (pathwayId: number, optionId: number) => Promise<void>;
  };
  nodesRepository: {
    findOne: (id: number) => Promise<Node>; // Throws NotFoundError if not found
  };
  pathwayOptionEntityFactory: {
    create: (
      payload: CreatePathwayOptionPayload,
    ) => PathwayOptionEntity & { save: () => Promise<PathwayOptionEntity> };
    findOne: (id: number) => Promise<PathwayOptionEntity>;

    fromData: (data: PathwayOption) => PathwayOptionEntity;
  };
}

/**
 * Pathway entity with domain behavior
 * Extends all pathway properties for direct access (e.g., instance.name instead of instance.data.name)
 */
export interface PathwayEntity
  extends Omit<Pathway, 'id'>,
    BaseDomainEntity<PathwayEntity, UpdatePathwayPayload> {
  /** Associated pathway options (lazy-loaded) */
  options: Promise<PathwayOption[]>;

  /**
   * Extracts plain pathway data from the entity
   * @returns Plain pathway object without entity methods
   */
  toPathway: () => Pathway;

  /**
   * Adds an option to this pathway
   * @param optionData - Option data (pathwayId set automatically, isDefault optional)
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
   * Sets an option as the default option
   * Only one option can be default per pathway
   * @param optionId - The ID of the option to set as default
   * @returns A new PathwayEntity instance with updated default option
   * @throws {NotFoundError} If option is not found
   * @throws {ValidationError} If option doesn't belong to this pathway
   */
  setDefaultOption: (optionId: number) => Promise<PathwayEntity>;

  /**
   * Synchronizes tolls for an option (destructive operation)
   * @param optionId - The ID of the option to sync tolls for
   * @param tolls - Array of toll inputs (sequence assigned automatically 1..N)
   * @returns A new PathwayEntity instance with synchronized tolls
   * @throws {NotFoundError} If option is not found
   * @throws {ValidationError} If option doesn't belong to this pathway
   * @throws {FieldValidationError} If toll validation fails
   */
  syncOptionTolls: (
    optionId: number,
    tolls: SyncTollsInput[],
  ) => Promise<PathwayEntity>;

  /**
   * Gets all tolls for an option
   * @param optionId - The ID of the option to get tolls for
   * @returns Array of pathway option tolls
   * @throws {NotFoundError} If option is not found
   * @throws {ValidationError} If option doesn't belong to this pathway
   */
  getOptionTolls: (optionId: number) => Promise<PathwayOptionToll[]>;
}
