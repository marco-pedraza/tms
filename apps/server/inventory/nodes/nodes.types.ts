import { MatchesRegexp, Max, Min, MinLen } from 'encore.dev/validate';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '../../shared/types';
import type { City } from '../cities/cities.types';
import type { Installation } from '../installations/installations.types';
import type { Label } from '../labels/labels.types';
import type { NodeEventFlat } from '../node-events/node-events.types';
import type { Population } from '../populations/populations.types';

/**
 * Base interface representing a node entity
 */
export interface Node {
  /** Unique identifier for the node */
  id: number;

  /** Unique code identifier for the node */
  code: string;

  /** Name of the node */
  name: string;

  /** Latitude coordinate of the node */
  latitude: number;

  /** Longitude coordinate of the node */
  longitude: number;

  /** Radius of coverage for the node in meters */
  radius: number;

  /** URL-friendly identifier for the node */
  slug: string;

  /** Whether passengers can board at this node */
  allowsBoarding: boolean;

  /** Whether passengers can alight at this node */
  allowsAlighting: boolean;

  /** Whether the node is active or not */
  active: boolean;

  /** ID of the city this node belongs to */
  cityId: number;

  /** ID of the population this node belongs to */
  populationId: number;

  /** Optional ID of the installation associated with this node */
  installationId: number | null;

  /** Timestamp when the node record was created */
  createdAt: Date | string | null;

  /** Timestamp when the node record was last updated */
  updatedAt: Date | string | null;
}

/**
 * Input for creating a new node
 */
export interface CreateNodePayload {
  /**
   * Unique code identifier for the node
   * Must have at least 1 non-whitespace character
   */
  code: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Name of the node
   * Must have at least 1 non-whitespace character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Latitude coordinate of the node
   * Must be a number between -90 and 90
   */
  latitude: number & Min<-90> & Max<90>;

  /**
   * Longitude coordinate of the node
   * Must be a number between -180 and 180
   */
  longitude: number & Min<-180> & Max<180>;

  /**
   * Radius of coverage for the node in meters
   * Must be a positive number
   */
  radius: number & Min<1>;

  /**
   * Whether passengers can board at this node
   * @default false
   */
  allowsBoarding?: boolean;

  /**
   * Whether passengers can alight at this node
   * @default false
   */
  allowsAlighting?: boolean;

  /**
   * Whether the node is active or not
   * @default true
   */
  active?: boolean;

  /**
   * ID of the city this node belongs to
   * Must be a positive number
   */
  cityId: number & Min<1>;

  /**
   * ID of the population this node belongs to
   * Must be a positive number
   */
  populationId: number & Min<1>;

  /**
   * Optional ID of the installation associated with this node
   * Must be a positive number if provided
   */
  installationId?: number & Min<1>;
}

/**
 * Input for updating a node
 */
export interface UpdateNodePayload {
  /**
   * Unique code identifier for the node
   * Must have at least 1 non-whitespace character
   */
  code?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Name of the node
   * Must have at least 1 non-whitespace character
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Latitude coordinate of the node
   * Must be a number between -90 and 90
   */
  latitude?: number & Min<-90> & Max<90>;

  /**
   * Longitude coordinate of the node
   * Must be a number between -180 and 180
   */
  longitude?: number & Min<-180> & Max<180>;

  /**
   * Radius of coverage for the node in meters
   * Must be a positive number
   */
  radius?: number & Min<1>;

  /**
   * Whether passengers can board at this node
   */
  allowsBoarding?: boolean;

  /**
   * Whether passengers can alight at this node
   */
  allowsAlighting?: boolean;

  /**
   * Whether the node is active or not
   */
  active?: boolean;

  /**
   * ID of the city this node belongs to
   * Must be a positive number
   */
  cityId?: number & Min<1>;

  /**
   * ID of the population this node belongs to
   * Must be a positive number
   */
  populationId?: number & Min<1>;

  /**
   * Optional ID of the installation associated with this node
   * Must be a positive number if provided
   */
  installationId?: number & Min<1>;
}

/**
 * Node entity with related information
 */
export interface NodeWithRelations extends Node {
  city: City;
  population: Population;
  installation: Installation | null;
  nodeEvents: NodeEventFlat[];
  labels: Label[];
}

export type ListNodesQueryParams = ListQueryParams<Node>;
export type ListNodesResult = ListQueryResult<Node>;

export type PaginatedListNodesQueryParams = PaginatedListQueryParams<Node>;
export type PaginatedListNodesResult =
  PaginatedListQueryResult<NodeWithRelations>;

/**
 * Individual event assignment payload for the assign endpoint
 */
export interface NodeEventAssignmentPayload {
  /** ID of the event type to assign */
  eventTypeId: number;

  /** Optional custom time that overrides the base time */
  customTime?: number;
}

/**
 * Payload for assigning multiple events to a node
 */
export interface AssignEventsToNodePayload {
  /** Array of event assignments */
  events: NodeEventAssignmentPayload[];
}

/**
 * Input for assigning labels to a node
 */
export interface AssignLabelsToNodePayload {
  /**
   * Array of label IDs to assign to the node
   * Replaces all existing label assignments
   */
  labelIds: number[];
}
