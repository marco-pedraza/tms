import { Min } from 'encore.dev/validate';

/**
 * Base interface representing a route segment entity
 */
export interface RouteSegment {
  /** Unique identifier for the route segment */
  id: number;

  /** Reference to the parent route */
  parentRouteId: number;

  /** Reference to the segment route */
  segmentRouteId: number;

  /** Sequence order of this segment within the parent route */
  sequence: number;

  /** Whether this route segment is active */
  active: boolean;
}

/**
 * Interface for creating a new route segment
 */
export interface CreateRouteSegmentPayload {
  /**
   * Reference to the parent route
   */
  parentRouteId: number & Min<1>;

  /**
   * Reference to the segment route
   */
  segmentRouteId: number & Min<1>;

  /**
   * Sequence order of this segment within the parent route
   * Must be a non-negative number
   */
  sequence: number & Min<0>;

  /**
   * Whether this route segment is active
   */
  active?: boolean;
}

/**
 * Interface for updating a route segment
 */
export interface UpdateRouteSegmentPayload {
  /**
   * Reference to the parent route
   */
  parentRouteId?: number & Min<1>;

  /**
   * Reference to the segment route
   */
  segmentRouteId?: number & Min<1>;

  /**
   * Sequence order of this segment within the parent route
   * Must be a non-negative number
   */
  sequence?: number & Min<0>;

  /**
   * Whether this route segment is active
   */
  active?: boolean;
}
