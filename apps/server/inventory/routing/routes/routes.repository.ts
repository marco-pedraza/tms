import { inArray } from 'drizzle-orm';
import { NotFoundError, createBaseRepository } from '@repo/base-repo';
import type { TransactionalDB } from '@repo/base-repo';
import { db } from '@/inventory/db-service';
import { cities } from '@/inventory/locations/cities/cities.schema';
import type { City } from '@/inventory/locations/cities/cities.types';
import { nodes } from '@/inventory/locations/nodes/nodes.schema';
import type { Node } from '@/inventory/locations/nodes/nodes.types';
import { busLines } from '@/inventory/operators/bus-lines/bus-lines.schema';
import type { BusLine } from '@/inventory/operators/bus-lines/bus-lines.types';
import { serviceTypes } from '@/inventory/operators/service-types/service-types.schema';
import type { ServiceType } from '@/inventory/operators/service-types/service-types.types';
import { routeLegs } from '@/inventory/routing/route-legs/route-legs.schema';
import type { RouteLeg } from '@/inventory/routing/route-legs/route-legs.types';
import { routes } from './routes.schema';
import type {
  CreateRoutePayload,
  PaginatedListRoutesQueryParams,
  PaginatedListRoutesResult,
  Route,
  RouteEnriched,
  RouteMetrics,
  RouteWithRelations,
  UpdateRoutePayload,
} from './routes.types';

/**
 * Creates a repository for managing route entities
 * @returns {Object} An object containing route-specific operations and base CRUD operations
 */
export function createRouteRepository() {
  const baseRepository = createBaseRepository<
    Route,
    CreateRoutePayload,
    UpdateRoutePayload,
    typeof routes
  >(db, routes, 'Route', {
    searchableFields: [routes.name, routes.code],
    softDeleteEnabled: true,
    checkDependenciesOnSoftDelete: false, // Disable dependency check for soft delete
  });

  /**
   * Enriches routes with all related entities to prevent N+1 queries
   * @param data - Array of route entities to enrich
   * @returns Array of routes with all related entities included
   */
  async function enrichWithRelations(
    data: Route[],
  ): Promise<RouteWithRelations[]> {
    if (data.length === 0) {
      return [];
    }

    // Collect all unique IDs
    const nodeIds = new Set<number>();
    const cityIds = new Set<number>();
    const serviceTypeIds = new Set<number>();
    const busLineIds = new Set<number>();
    const routeIds: number[] = [];

    data.forEach((route) => {
      routeIds.push(route.id);
      nodeIds.add(route.originNodeId);
      nodeIds.add(route.destinationNodeId);
      cityIds.add(route.originCityId);
      cityIds.add(route.destinationCityId);
      serviceTypeIds.add(route.serviceTypeId);
      busLineIds.add(route.buslineId);
    });

    // Fetch all required data in parallel
    const [
      nodesData,
      citiesData,
      serviceTypesData,
      busLinesData,
      routeLegsData,
    ] = await Promise.all([
      db
        .select()
        .from(nodes)
        .where(inArray(nodes.id, Array.from(nodeIds))),
      db
        .select()
        .from(cities)
        .where(inArray(cities.id, Array.from(cityIds))),
      db
        .select()
        .from(serviceTypes)
        .where(inArray(serviceTypes.id, Array.from(serviceTypeIds))),
      db
        .select()
        .from(busLines)
        .where(inArray(busLines.id, Array.from(busLineIds))),
      db.select().from(routeLegs).where(inArray(routeLegs.routeId, routeIds)),
    ]);

    // Create maps for quick lookups
    const nodesMap = new Map<number, Node>();
    nodesData.forEach((node) => {
      nodesMap.set(node.id, node);
    });

    const citiesMap = new Map<number, City>();
    citiesData.forEach((city) => {
      citiesMap.set(city.id, city);
    });

    const serviceTypesMap = new Map<number, ServiceType>();
    serviceTypesData.forEach((serviceType) => {
      serviceTypesMap.set(serviceType.id, serviceType);
    });

    const busLinesMap = new Map<number, BusLine>();
    busLinesData.forEach((busLine) => {
      busLinesMap.set(busLine.id, busLine);
    });

    // Group route legs by route ID
    const routeLegsMap = new Map<number, RouteLeg[]>();
    routeLegsData.forEach((leg) => {
      const legs = routeLegsMap.get(leg.routeId) ?? [];
      legs.push(leg);
      routeLegsMap.set(leg.routeId, legs);
    });

    // Enrich routes with their relations
    return data.map((route) => {
      const originNode = nodesMap.get(route.originNodeId);
      const destinationNode = nodesMap.get(route.destinationNodeId);
      const originCity = citiesMap.get(route.originCityId);
      const destinationCity = citiesMap.get(route.destinationCityId);
      const serviceType = serviceTypesMap.get(route.serviceTypeId);
      const busline = busLinesMap.get(route.buslineId);
      const legs = routeLegsMap.get(route.id) ?? [];

      if (!originNode || !destinationNode) {
        throw new NotFoundError(
          `Missing node(s) for route ${route.id}: originNodeId=${route.originNodeId} (${originNode ? 'found' : 'missing'}), destinationNodeId=${route.destinationNodeId} (${destinationNode ? 'found' : 'missing'})`,
        );
      }

      if (!originCity || !destinationCity) {
        throw new NotFoundError(
          `Missing city(ies) for route ${route.id}: originCityId=${route.originCityId} (${originCity ? 'found' : 'missing'}), destinationCityId=${route.destinationCityId} (${destinationCity ? 'found' : 'missing'})`,
        );
      }

      if (!serviceType) {
        throw new NotFoundError(
          `Missing service type for route ${route.id}: serviceTypeId=${route.serviceTypeId}`,
        );
      }

      if (!busline) {
        throw new NotFoundError(
          `Missing bus line for route ${route.id}: buslineId=${route.buslineId}`,
        );
      }

      return {
        id: route.id,
        code: route.code,
        name: route.name,
        serviceTypeId: route.serviceTypeId,
        buslineId: route.buslineId,
        originNodeId: route.originNodeId,
        destinationNodeId: route.destinationNodeId,
        originCityId: route.originCityId,
        destinationCityId: route.destinationCityId,
        active: route.active,
        createdAt: route.createdAt,
        updatedAt: route.updatedAt,
        originNode,
        destinationNode,
        originCity,
        destinationCity,
        serviceType,
        busline,
        routeLegs: legs,
      };
    });
  }

  async function findAllPaginatedWithRelations(
    params: PaginatedListRoutesQueryParams,
  ): Promise<PaginatedListRoutesResult> {
    // Get paginated results using base repository
    const result = await baseRepository.findAllPaginated(params);

    // Enrich with relations
    const enrichedData = await enrichWithRelations(result.data);

    return {
      data: enrichedData,
      pagination: result.pagination,
    };
  }

  /**
   * Creates a new route with optional transaction support
   * @param payload - The route creation data
   * @param tx - Optional transaction instance
   * @returns The created route
   */
  function create(
    payload: Omit<CreateRoutePayload, 'legs'> & {
      originCityId: number;
      destinationCityId: number;
    },
    tx?: TransactionalDB,
  ): Promise<Route> {
    const repository = tx ? baseRepository.withTransaction(tx) : baseRepository;
    // Create a complete payload by adding empty legs array (legs are handled separately in entity)
    const completePayload: CreateRoutePayload = {
      ...payload,
      legs: [], // Empty array since legs are handled separately in the entity layer
    };
    return repository.create(completePayload);
  }

  /**
   * Updates an existing route with optional transaction support
   * @param id - The route ID to update
   * @param payload - The update data
   * @param tx - Optional transaction instance
   * @returns The updated route
   */
  function update(
    id: number,
    payload: UpdateRoutePayload,
    tx?: TransactionalDB,
  ): Promise<Route> {
    const repository = tx ? baseRepository.withTransaction(tx) : baseRepository;
    return repository.update(id, payload);
  }

  /**
   * Finds a route by ID with optional transaction support
   * @param id - The route ID to find
   * @param tx - Optional transaction instance
   * @returns The found route
   * @throws {NotFoundError} If route is not found
   */
  function findOne(id: number, tx?: TransactionalDB): Promise<Route> {
    const repository = tx ? baseRepository.withTransaction(tx) : baseRepository;
    return repository.findOne(id);
  }

  /**
   * Finds a route by ID with enriched data (nodes with cities, legs with relations, metrics)
   * @param id - The route ID to find
   * @returns The route with enriched data
   * @throws {NotFoundError} If route is not found
   */
  async function findRouteEnriched(id: number): Promise<RouteEnriched> {
    const routeWithRelations = await db.query.routes.findFirst({
      where: (routes, { eq, and, isNull }) =>
        and(eq(routes.id, id), isNull(routes.deletedAt)),
      with: {
        busline: true,
        serviceType: true,
        originCity: true,
        destinationCity: true,
        originNode: {
          with: {
            city: true,
          },
        },
        destinationNode: {
          with: {
            city: true,
          },
        },
        routeLegs: {
          where: (routeLegs, { isNull }) => isNull(routeLegs.deletedAt),
          orderBy: (routeLegs, { asc }) => [asc(routeLegs.position)],
          with: {
            pathway: true,
            pathwayOption: {
              with: {
                pathwayOptionTolls: {
                  with: {
                    toll: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!routeWithRelations) {
      throw new NotFoundError(`Route with id ${id} not found`);
    }

    // Calculate metrics
    const metrics: RouteMetrics = {
      totalDistance: routeWithRelations.routeLegs
        .filter((leg) => !leg.isDerived)
        .reduce((sum, leg) => sum + (leg.pathwayOption.distanceKm ?? 0), 0),
      totalTime: routeWithRelations.routeLegs
        .filter((leg) => !leg.isDerived)
        .reduce((sum, leg) => sum + (leg.pathwayOption.typicalTimeMin ?? 0), 0),
      legCount: routeWithRelations.routeLegs.filter((leg) => !leg.isDerived)
        .length,
    };

    return {
      ...routeWithRelations,
      busline: routeWithRelations.busline,
      serviceType: routeWithRelations.serviceType,
      originNode: {
        ...routeWithRelations.originNode,
        city: routeWithRelations.originCity,
      },
      destinationNode: {
        ...routeWithRelations.destinationNode,
        city: routeWithRelations.destinationCity,
      },
      legs: routeWithRelations.routeLegs.map((leg) => ({
        ...leg,
        pathway: leg.pathway,
        option: {
          ...leg.pathwayOption,
          tollbooths: leg.pathwayOption.pathwayOptionTolls.map((toll) => ({
            ...toll,
            tollbooth: toll.toll,
          })),
        },
      })),
      metrics,
    };
  }

  return {
    ...baseRepository,
    create,
    update,
    findOne,
    findRouteEnriched,
    findAllPaginatedWithRelations,
  };
}

// Export the route repository instance
export const routesRepository = createRouteRepository();
