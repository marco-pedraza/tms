import { MatchesRegexp, Min, MinLen } from 'encore.dev/validate';
import { PaginatedResult } from '../../shared/types';
import { PathwayServiceAssignment } from '../pathway-service-assignments/pathway-service-assignments.types';
import type { PathwayService } from '../pathway-services/pathway-services.types';

/**
 * Base interface representing a pathway entity
 */
export interface Pathway {
  /** Unique identifier for the pathway */
  id: number;

  /** Name of the pathway */
  name: string;

  /** Distance of the pathway */
  distance: number;

  /** Typical time to travel the pathway */
  typicalTime: number;

  /** Metadata about the pathway */
  meta: Record<string, unknown>;

  /** Whether the pathway is a toll road */
  tollRoad: boolean;

  /** Whether the pathway is active */
  active: boolean;

  /** Timestamp when the pathway was created */
  createdAt: Date;

  /** Timestamp when the pathway was last updated */
  updatedAt: Date;
}

/**
 * Interface for a pathway with its services and assignment details
 */
export interface PathwayWithServiceAssignments extends Pathway {
  pathwayServiceAssignments: (PathwayServiceAssignment & {
    pathwayService: PathwayService;
  })[];
}

/**
 * Interface for creating a new pathway
 */
export interface CreatePathwayPayload {
  /**
   * Name of the pathway
   * Must have at least 1 character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Distance of the pathway
   * Must be a positive number
   */
  distance: number & Min<1>;

  /**
   * Typical time to travel the pathway
   * Must be a positive number
   */
  typicalTime: number & Min<1>;

  /**
   * Metadata about the pathway
   */
  meta: Record<string, string | number | boolean | null>;

  /**
   * Whether the pathway is a toll road
   */
  tollRoad: boolean;

  /**
   * Whether the pathway is active
   */
  active: boolean;
}

/**
 * Interface for updating a pathway
 */
export interface UpdatePathwayPayload {
  /**
   * Name of the pathway
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Distance of the pathway
   */
  distance?: number & Min<1>;

  /**
   * Typical time to travel the pathway
   */
  typicalTime?: number & Min<1>;

  /**
   * Metadata about the pathway
   */
  meta?: Record<string, string | number | boolean | null>;

  /**
   * Whether the pathway is a toll road
   */
  tollRoad?: boolean;

  /**
   * Whether the pathway is active
   */
  active?: boolean;
}

/**
 * Interface for listing pathways
 */
export interface Pathways {
  pathways: Pathway[];
}

/**
 * Paginated response type for the list pathways endpoint
 */
export type PaginatedPathways = PaginatedResult<Pathway>;
