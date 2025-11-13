import { MatchesRegexp, Min, MinLen } from 'encore.dev/validate';
import type { TransactionalDB } from '@repo/base-repo';
import type { BaseDomainEntity } from '@/shared/domain/base-entity';
import {
  ListQueryParams,
  ListQueryResult,
  PaginatedListQueryParams,
  PaginatedListQueryResult,
} from '@/shared/types';
import { City } from '@/inventory/locations/cities/cities.types';
import { Node } from '@/inventory/locations/nodes/nodes.types';
import { BusLine } from '@/inventory/operators/bus-lines/bus-lines.types';
import { ServiceType } from '@/inventory/operators/service-types/service-types.types';
import { Pathway } from '@/inventory/routing/pathways/pathways.types';
import type { CreateRouteLegWithNodesPayload } from '@/inventory/routing/route-legs/route-legs.repository';
import type {
  CreateRouteLegPayload,
  RouteLeg,
  RouteLegWithRelations,
  UpdateRouteLegPayload,
} from '@/inventory/routing/route-legs/route-legs.types';

/**
 * Base interface representing a route entity
 */
export interface Route {
  /** Unique identifier for the route */
  id: number;

  /** Unique code for the route */
  code: string;

  /** Name of the route */
  name: string;

  /** Description of the route */
  description: string | null;

  /** Service type ID */
  serviceTypeId: number;

  /** Bus line ID */
  buslineId: number;

  /** Origin node ID */
  originNodeId: number;

  /** Destination node ID */
  destinationNodeId: number;

  /** Origin city ID */
  originCityId: number;

  /** Destination city ID */
  destinationCityId: number;

  /** Whether the route is active */
  active: boolean;

  /** Timestamp when the route was created */
  createdAt: Date | string | null;

  /** Timestamp when the route was last updated */
  updatedAt: Date | string | null;
}

/**
 * Interface for a route with relations
 */
export interface RouteWithRelations extends Route {
  serviceType: ServiceType;
  busline: BusLine;
  originNode: Node;
  destinationNode: Node;
  originCity: City;
  destinationCity: City;
  routeLegs: RouteLeg[];
}

/**
 * Interface for creating a new route
 */
export interface CreateRoutePayload {
  /**
   * Unique code for the route
   * Must have at least 1 character
   */
  code: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Name of the route
   * Must have at least 1 character
   */
  name: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Description of the route
   */
  description?: string | null;

  /**
   * Service type ID
   * Must be a positive number
   */
  serviceTypeId: number & Min<1>;

  /**
   * Bus line ID
   * Must be a positive number
   */
  buslineId: number & Min<1>;

  /**
   * Origin node ID
   * Must be a positive number
   */
  originNodeId: number & Min<1>;

  /**
   * Destination node ID
   * Must be a positive number
   */
  destinationNodeId: number & Min<1>;

  /**
   * Array of route legs
   * Must have at least 1 leg
   */
  legs: CreateRouteLegPayload[] & MinLen<1>;

  /**
   * Whether the route is active
   * @default true
   */
  active?: boolean;
}

/**
 * Interface for updating a route
 */
export interface UpdateRoutePayload {
  /**
   * Unique code for the route
   * Must have at least 1 character
   */
  code?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Name of the route
   */
  name?: string & MinLen<1> & MatchesRegexp<'.*\\S.*'>;

  /**
   * Description of the route
   */
  description?: string | null;

  /**
   * Service type ID
   */
  serviceTypeId?: number & Min<1>;

  /**
   * Bus line ID
   */
  buslineId?: number & Min<1>;

  /**
   * Origin node ID
   */
  originNodeId?: number & Min<1>;

  /**
   * Destination node ID
   */
  destinationNodeId?: number & Min<1>;

  /**
   * Array of route legs
   * Must have at least 1 leg
   */
  legs?: UpdateRouteLegPayload[] & MinLen<1>;

  /**
   * Whether the route is active
   */
  active?: boolean;
}

/**
 * Interface for route metrics
 */
export interface RouteMetrics {
  /** Total distance in kilometers */
  totalDistance: number;

  /** Total time in minutes */
  totalTime: number;

  /** Number of legs (excluding derived legs) */
  legCount: number;
}

/**
 * Interface for route with enriched data and metrics
 */
export interface RouteEnriched extends Route {
  /** Service type */
  serviceType: ServiceType;

  /** Bus line */
  busline: BusLine;

  /** Origin node with city information */
  originNode: Node & { city: City };

  /** Destination node with city information */
  destinationNode: Node & { city: City };

  /** Route legs with enriched data */
  legs: RouteLegWithRelations[];

  /** Route metrics */
  metrics: RouteMetrics;
}

export type ListRoutesQueryParams = ListQueryParams<Route>;
export type ListRoutesResult = ListQueryResult<Route>;

export type PaginatedListRoutesQueryParams = PaginatedListQueryParams<Route>;
export type PaginatedListRoutesResult =
  PaginatedListQueryResult<RouteWithRelations>;

// =============================================================================
// ROUTE ENTITY DEPENDENCIES AND INTERFACE
// =============================================================================

/**
 * Route entity with domain behavior
 * Extends all route properties for direct access (e.g., instance.name instead of instance.data.name)
 */
export interface RouteEntity
  extends Omit<Route, 'id'>,
    Omit<BaseDomainEntity<RouteEntity, UpdateRoutePayload>, 'save' | 'update'> {
  /**
   * Extracts plain route data from the entity
   * @returns Plain route object without entity methods
   */
  toRoute: () => Route;

  /**
   * Saves the route to the database
   * Routes require transactions because they create records in both routes and route_legs tables
   * @param tx - Database transaction instance (required)
   * @returns The saved route entity
   */
  save(tx: TransactionalDB): Promise<RouteEntity>;

  /**
   * Updates the route in the database
   * @param payload - The update data
   * @param tx - Database transaction instance (required)
   * @returns The updated route entity
   */
  update(
    payload: UpdateRoutePayload,
    tx: TransactionalDB,
  ): Promise<RouteEntity>;
}

/**
 * Dependencies required by the route entity
 */
export interface RouteEntityDependencies {
  routesRepository: {
    create: (
      payload: Omit<CreateRoutePayload, 'legs'> & {
        originCityId: number;
        destinationCityId: number;
      },
      tx?: TransactionalDB,
    ) => Promise<Route>;
    update: (
      id: number,
      payload: UpdateRoutePayload,
      tx?: TransactionalDB,
    ) => Promise<Route>;
    findOne: (id: number, tx?: TransactionalDB) => Promise<Route>; // Throws NotFoundError if not found
  };
  nodeRepository: {
    findOne: (id: number) => Promise<Node>; // Throws NotFoundError if not found
  };
  pathwayRepository: {
    findByIds: (ids: number[], tx?: TransactionalDB) => Promise<Pathway[]>;
  };
  pathwayOptionRepository: {
    findByIds: (ids: number[]) => Promise<
      {
        id: number;
        pathwayId: number;
      }[]
    >;
  };
  busLineRepository: {
    findOne: (id: number) => Promise<BusLine>; // Throws NotFoundError if not found
  };
  serviceTypeRepository: {
    findOne: (id: number) => Promise<ServiceType>; // Throws NotFoundError if not found
  };
  routeLegsRepository: {
    createLegs: (
      legs: CreateRouteLegWithNodesPayload[],
      tx?: TransactionalDB,
    ) => Promise<RouteLeg[]>;
    deleteByRouteId: (routeId: number, tx?: TransactionalDB) => Promise<void>;
  };
}
