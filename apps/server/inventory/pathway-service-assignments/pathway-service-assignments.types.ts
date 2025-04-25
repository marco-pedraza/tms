import { Min } from 'encore.dev/validate';
import { PaginatedResult } from '../../shared/types';

/**
 * Base interface representing a pathway service assignment entity
 */
export interface PathwayServiceAssignment {
  /** Unique identifier for the pathway service assignment */
  id: number;

  /** Reference to the pathway */
  pathwayId: number;

  /** Reference to the pathway service */
  pathwayServiceId: number;

  /** Cost associated with this service on this pathway (optional) */
  associatedCost?: number;

  /** Order sequence along the pathway */
  sequence: number;

  /** Distance from origin in kilometers */
  distanceFromOrigin: number;

  /** Whether this service is mandatory for the pathway */
  mandatory: boolean;

  /** Timestamp when the assignment was created */
  createdAt: Date;

  /** Timestamp when the assignment was last updated */
  updatedAt: Date;
}

/**
 * Interface for creating a new pathway service assignment
 */
export interface CreatePathwayServiceAssignmentPayload {
  /**
   * Reference to the pathway
   */
  pathwayId: number;

  /**
   * Reference to the pathway service
   */
  pathwayServiceId: number;

  /**
   * Cost associated with this service on this pathway (optional)
   * Must be a non-negative number if provided
   */
  associatedCost?: number & Min<0>;

  /**
   * Distance from origin in kilometers
   * Must be a non-negative number
   */
  distanceFromOrigin: number & Min<0>;

  /**
   * Whether this service is mandatory for the pathway
   */
  mandatory?: boolean;
}

/**
 * Interface for updating a pathway service assignment
 * Only allows updating metadata fields
 */
export interface UpdatePathwayServiceAssignmentPayload {
  /**
   * Cost associated with this service on this pathway
   * Must be a non-negative number
   */
  associatedCost?: number & Min<0>;

  /**
   * Whether this service is mandatory for the pathway
   */
  mandatory?: boolean;

  /**
   * Distance from origin in kilometers
   * Must be a non-negative number
   */
  distanceFromOrigin?: number & Min<0>;
}

/**
 * Interface for listing pathway service assignments
 */
export interface PathwayServiceAssignments {
  pathwayServiceAssignments: PathwayServiceAssignment[];
}

/**
 * Paginated response type for the list pathway service assignments endpoint
 */
export type PaginatedPathwayServiceAssignments =
  PaginatedResult<PathwayServiceAssignment>;

/**
 * Interface for deleting a pathway service assignment
 */
export interface DeletePathwayServiceAssignmentPayload {
  /**
   * Reference to the pathway
   * Must have at least 1 character
   */
  pathwayId: number;

  /**
   * Unique identifier for the pathway service assignment
   */
  assignmentId: number;
}
