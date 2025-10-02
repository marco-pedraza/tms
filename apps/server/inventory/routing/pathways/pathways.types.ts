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
 * Interface for a pathway with relations
 */
export interface PathwayWithRelations extends Pathway {
  origin: Node;
  destination: Node;
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
 * Defines the repository contracts and entity factories needed for pathway entity operations
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
    delete: (id: number) => Promise<PathwayOption>; // Throws NotFoundError if not found
    setDefaultOption: (pathwayId: number, optionId: number) => Promise<void>;
  };
  nodesRepository: {
    findOne: (id: number) => Promise<{ id: number; cityId: number }>;
  };
  pathwayOptionEntityFactory: {
    create: (payload: CreatePathwayOptionPayload) => PathwayOptionEntity;
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
   * Sets an option as the default option
   * Only one option can be default per pathway
   * @param optionId - The ID of the option to set as default
   * @returns A new PathwayEntity instance with updated default option
   * @throws {NotFoundError} If option is not found
   * @throws {ValidationError} If option doesn't belong to this pathway
   */
  setDefaultOption: (optionId: number) => Promise<PathwayEntity>;

  /**
   * Synchronizes tolls for a pathway option (destructive operation)
   * Delegates to PathwayOptionEntity while maintaining aggregate boundary
   * @param optionId - The ID of the option to sync tolls for
   * @param tolls - Array of toll inputs (sequence assigned automatically 1..N)
   * @returns A new PathwayEntity instance after sync
   * @throws {NotFoundError} If option is not found
   * @throws {ValidationError} If option doesn't belong to this pathway
   * @throws {FieldValidationError} If toll validation fails
   */
  syncOptionTolls: (
    optionId: number,
    tolls: SyncTollsInput[],
  ) => Promise<PathwayEntity>;

  /**
   * Gets all tolls for a pathway option
   * Delegates to PathwayOptionEntity while maintaining aggregate boundary
   * @param optionId - The ID of the option to get tolls from
   * @returns Array of pathway option tolls ordered by sequence
   * @throws {NotFoundError} If option is not found
   * @throws {ValidationError} If option doesn't belong to this pathway
   */
  getOptionTolls: (optionId: number) => Promise<PathwayOptionToll[]>;
}
