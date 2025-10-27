import { Min } from 'encore.dev/validate';
import type { Node } from '@/inventory/locations/nodes/nodes.types';
import type { PathwayOptionToll } from '@/inventory/routing/pathway-options-tolls/pathway-options-tolls.types';
import type { PathwayOption } from '@/inventory/routing/pathway-options/pathway-options.types';
import type { Pathway } from '@/inventory/routing/pathways/pathways.types';

/**
 * Base interface representing a route leg entity
 */
export interface RouteLeg {
  /** Unique identifier for the route leg */
  id: number;

  /** Position in the route sequence */
  position: number;

  /** Route ID this leg belongs to */
  routeId: number;

  /** Origin node ID */
  originNodeId: number;

  /** Destination node ID */
  destinationNodeId: number;

  /** Pathway ID */
  pathwayId: number;

  /** Pathway option ID */
  pathwayOptionId: number;

  /** Whether this leg is derived (e.g., toll booths) */
  isDerived: boolean;

  /** Whether the leg is active */
  active: boolean;

  /** Timestamp when the leg was created */
  createdAt: Date | string | null;

  /** Timestamp when the leg was last updated */
  updatedAt: Date | string | null;
}

/**
 * Interface for a route leg with enriched data
 */
export interface RouteLegWithRelations extends RouteLeg {
  /** Pathway information */
  pathway: Pathway;

  /** Pathway option information with tollbooths */
  option: PathwayOption & {
    /** Tollbooths along this pathway option */
    tollbooths: (PathwayOptionToll & {
      /** Tollbooth node information */
      tollbooth: Node;
    })[];
  };
}
/**
 * Interface for creating a new route leg
 */
export interface CreateRouteLegPayload {
  /**
   * Position in the route sequence
   * Must be a positive number
   */
  position: number & Min<1>;

  /**
   * Pathway ID
   * Must be a positive number
   */
  pathwayId: number & Min<1>;

  /**
   * Pathway option ID
   * Must be a positive number
   */
  pathwayOptionId: number & Min<1>;

  /**
   * Whether this leg is derived (e.g., toll booths)
   * @default false
   */
  isDerived?: boolean;

  /**
   * Whether the leg is active
   * @default true
   */
  active?: boolean;
}

/**
 * Interface for updating a route leg
 */
export interface UpdateRouteLegPayload {
  /**
   * Position in the route sequence
   * Must be a positive number
   */
  position: number & Min<1>;

  /**
   * Pathway ID
   * Must be a positive number
   */
  pathwayId: number & Min<1>;

  /**
   * Pathway option ID
   * Must be a positive number
   */
  pathwayOptionId: number & Min<1>;

  /**
   * Whether this leg is derived (e.g., toll booths)
   */
  isDerived?: boolean;

  /**
   * Whether the leg is active
   */
  active?: boolean;
}
