import { Min } from 'encore.dev/validate';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '@/shared/types';

/**
 * Base interface representing a pathway option toll entity
 */
export interface PathwayOptionToll {
  /** Unique identifier for the pathway option toll */
  id: number;

  /** ID of the pathway option this toll belongs to */
  pathwayOptionId: number;

  /** ID of the node where the toll is located */
  nodeId: number;

  /** Sequence order of this toll in the pathway option */
  sequence: number;

  /** Time to pass through this toll in minutes */
  passTimeMin: number;

  /** Distance to this toll point */
  distance: number | null;

  /** Timestamp when the pathway option toll was created */
  createdAt: Date | string | null;

  /** Timestamp when the pathway option toll was last updated */
  updatedAt: Date | string | null;

  /** Timestamp when the pathway option toll was deleted */
  deletedAt: Date | string | null;
}

/**
 * Interface for creating a new pathway option toll
 */
export interface CreatePathwayOptionTollPayload {
  /**
   * ID of the pathway option this toll belongs to
   * Must be a positive number
   */
  pathwayOptionId: number & Min<1>;

  /**
   * ID of the node where the toll is located
   * Must be a positive number
   */
  nodeId: number & Min<1>;

  /**
   * Sequence order of this toll in the pathway option
   * Must be a positive number
   */
  sequence: number & Min<1>;

  /**
   * Time to pass through this toll in minutes
   * Must be a positive number
   */
  passTimeMin: number & Min<1>;

  /**
   * Distance to this toll point
   * Must be a non-negative number
   */
  distance?: number & Min<0>;
}

/**
 * Interface for updating a pathway option toll
 */
export interface UpdatePathwayOptionTollPayload {
  /**
   * ID of the pathway option this toll belongs to
   */
  pathwayOptionId?: number & Min<1>;

  /**
   * ID of the node where the toll is located
   */
  nodeId?: number & Min<1>;

  /**
   * Sequence order of this toll in the pathway option
   */
  sequence?: number & Min<1>;

  /**
   * Time to pass through this toll in minutes
   */
  passTimeMin?: number & Min<1>;

  /**
   * Distance to this toll point
   */
  distance?: number & Min<0>;
}

export type ListPathwayOptionTollsQueryParams =
  ListQueryParams<PathwayOptionToll>;
export type ListPathwayOptionTollsResult = ListQueryResult<PathwayOptionToll>;

export type PaginatedListPathwayOptionTollsQueryParams =
  PaginatedListQueryParams<PathwayOptionToll>;
export type PaginatedListPathwayOptionTollsResult =
  PaginatedListQueryResult<PathwayOptionToll>;
