import { Min } from 'encore.dev/validate';
import { Pathway, CreatePathwayPayload } from '../pathways/pathways.types';
import { City } from '../cities/cities.types';
import { Terminal } from '../terminals/terminals.types';
import { PaginatedResult, PaginationParams } from '../../shared/types';
import { RouteSegment } from '../route-segment/route-segment.types';

/**
 * Base interface representing a route entity
 */
export interface Route {
  /** Unique identifier for the route */
  id: number;

  /** Name of the route */
  name: string;

  /** Description of the route (optional) */
  description: string | null;

  /** Reference to the origin city */
  originCityId: number;

  /** Reference to the destination city */
  destinationCityId: number;

  /** Reference to the origin terminal */
  originTerminalId: number;

  /** Reference to the destination terminal */
  destinationTerminalId: number;

  /** Reference to the pathway used by this route */
  pathwayId: number | null;

  /** Total distance of the route in kilometers */
  distance: number;

  /** Base travel time in minutes without any stops/services */
  baseTime: number;

  /** Whether this is a compound route (has connections) */
  isCompound: boolean;

  /** Number of connections in this route */
  connectionCount: number;

  /** Total travel time including all stops/services in minutes */
  totalTravelTime: number;

  /** Total distance including any detours for services in kilometers */
  totalDistance: number;

  /** Timestamp when the route was created */
  createdAt: Date;

  /** Timestamp when the route was last updated */
  updatedAt: Date;
}

export interface RouteWithFullDetails extends Route {
  originCity: City;
  destinationCity: City;
  originTerminal: Terminal;
  destinationTerminal: Terminal;
  pathway: Omit<Pathway, 'meta'> | null;
  routeSegments: RouteSegment[];
}

/**
 * Interface for creating a new route
 */
export interface CreateRoutePayload {
  /**
   * Name of the route
   */
  name: string;

  /**
   * Description of the route (optional)
   */
  description?: string;

  /**
   * Reference to the origin terminal
   */
  originTerminalId: number & Min<1>;

  /**
   * Reference to the destination terminal
   */
  destinationTerminalId: number & Min<1>;

  /**
   * Reference to the pathway used by this route
   */
  pathwayId?: number;

  /**
   * Total distance of the route in kilometers
   * Must be a non-negative number
   */
  distance: number;

  /**
   * Base travel time in minutes without any stops/services
   * Must be a non-negative number
   */
  baseTime: number & Min<0>;

  /**
   * Whether this is a compound route (has connections)
   */
  isCompound?: boolean;

  /**
   * Number of connections in this route
   */
  connectionCount?: number;

  /**
   * Total travel time including all stops/services in minutes
   * Must be a non-negative number
   */
  totalTravelTime: number;

  /**
   * Total distance including any detours for services in kilometers
   * Must be a non-negative number
   */
  totalDistance: number;
}

/**
 * Interface for updating a route
 */
export interface UpdateRoutePayload {
  /**
   * Name of the route
   */
  name?: string;

  /**
   * Description of the route
   */
  description?: string;

  /**
   * Reference to the origin terminal
   */
  originTerminalId?: number & Min<1>;

  /**
   * Reference to the destination terminal
   */
  destinationTerminalId?: number & Min<1>;

  /**
   * Reference to the pathway used by this route
   */
  pathwayId?: number;

  /**
   * Total distance of the route in kilometers
   * Must be a non-negative number
   */
  distance?: number & Min<0>;

  /**
   * Base travel time in minutes without any stops/services
   * Must be a non-negative number
   */
  baseTime?: number & Min<0>;

  /**
   * Whether this is a compound route (has connections)
   */
  isCompound?: boolean;

  /**
   * Number of connections in this route
   */
  connectionCount?: number;

  /**
   * Total travel time including all stops/services in minutes
   * Must be a non-negative number
   */
  totalTravelTime?: number & Min<0>;

  /**
   * Total distance including any detours for services in kilometers
   * Must be a non-negative number
   */
  totalDistance?: number & Min<0>;
}

/**
 * Interface for listing routes
 */
export interface Routes {
  routes: Route[];
}

/**
 * Query options for filtering and ordering routes
 */
export interface RoutesQueryOptions {
  orderBy?: { field: keyof Route; direction: 'asc' | 'desc' }[];
  filters?: Partial<Route>;
}

/**
 * Paginated response type for the list routes endpoint
 */
export type PaginatedRoutes = PaginatedResult<Route>;

/**
 * Pagination and query parameters for routes
 */
export interface PaginationParamsRoutes
  extends PaginationParams,
    RoutesQueryOptions {}

/**
 * Interface extending CreateRoutePayload with city IDs
 */
export interface CreateRoutePayloadWithCityIds extends CreateRoutePayload {
  /** Reference to the origin city */
  originCityId: number;

  /** Reference to the destination city */
  destinationCityId: number;
}

/**
 * Pathway fields required to create a simple route
 */
export type PathwayFields = Omit<CreatePathwayPayload, 'name'> & {
  /** Custom name for the pathway (defaults to route name if not provided) */
  pathwayName?: string;
};

/**
 * Interface for creating a simple route that also creates a pathway
 */
export interface CreateSimpleRoutePayload
  extends Omit<
      CreateRoutePayload,
      'pathwayId' | 'distance' | 'totalTravelTime' | 'totalDistance'
    >,
    PathwayFields {
  /** Whether this is a compound route */
  isCompound: false;
}

/**
 * Interface for creating a compound route
 */
export interface CreateCompoundRoutePayload
  extends Omit<
    CreateRoutePayload,
    'pathwayId' | 'distance' | 'totalTravelTime' | 'totalDistance'
  > {
  /** Whether this is a compound route */
  isCompound: true;
}
