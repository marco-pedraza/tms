import { MatchesRegexp, Min, MinLen } from 'encore.dev/validate';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '@/shared/types';
import { Node } from '@/inventory/locations/nodes/nodes.types';

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
