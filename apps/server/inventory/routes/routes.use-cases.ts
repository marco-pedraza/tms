import { ValidationError } from '../../shared/errors';
import { pathwayRepository } from '../pathways/pathways.repository';
import { CreatePathwayPayload } from '../pathways/pathways.types';
import { routeSegmentRepository } from '../route-segment/route-segment.repository';
import { routeSegments } from '../route-segment/route-segment.schema';
import {
  CreateRoutePayloadWithCityIds,
  CreateSimpleRoutePayload,
  Route,
} from './routes.types';
import { routeRepository } from './routes.repository';

const ROUTE_ERRORS = {
  SAME_CITY: 'Origin and destination cities cannot be the same',
  REPEATED_SEGMENTS: 'Route segments cannot be repeated',
  ROUTES_NOT_FOUND: (ids: number[]) =>
    `Routes with ids [${ids.join(', ')}] not found or are compound routes`,
  INVALID_CONNECTION: (idA: number, idB: number) =>
    `Invalid route connection between route id ${idA} and route id ${idB}: origin and destination cities mismatch`,
  COMPOUND_ROUTE_MINIMUM: 'A compound route requires at least two routes',
  FAILED_CREATE_SEGMENTS: 'Failed to create all route segments',
  FAILED_REPLACE_SEGMENTS: 'Failed to replace route segments',
};

/**
 * Creates a simple route by first creating a pathway and then creating a route that uses it
 *
 * @param payload - The payload containing both pathway and route information
 * @returns The created route
 */
function createSimpleRoute(payload: CreateSimpleRoutePayload) {
  const {
    // Pathway properties
    pathwayName,
    name,
    distance,
    typicalTime,
    meta,
    tollRoad,
    active,

    // Route properties
    originCityId,
    destinationCityId,
    baseTime,
    description,
    connectionCount = 0,
    isCompound = false,
  } = payload;

  if (originCityId === destinationCityId) {
    throw new ValidationError(ROUTE_ERRORS.SAME_CITY);
  }

  // Create the pathway and route in a single transaction
  return routeRepository.transaction(async (txRouteRepo, tx) => {
    const txPathwayRepo = pathwayRepository.withTransaction(tx);

    // Create the pathway first
    const pathwayPayload: CreatePathwayPayload = {
      name: pathwayName ?? name, // Use pathwayName if provided, otherwise use route name
      distance,
      typicalTime,
      meta,
      tollRoad,
      active,
    };

    const pathway = await txPathwayRepo.create(pathwayPayload);

    // Create the route using the newly created pathway
    const routePayload: CreateRoutePayloadWithCityIds = {
      name,
      description,
      originCityId,
      destinationCityId,
      pathwayId: pathway.id,
      distance,
      baseTime,
      isCompound,
      connectionCount,
      totalTravelTime: typicalTime,
      totalDistance: distance,
    };

    return await txRouteRepo.create(routePayload);
  });
}

function validateRouteIds(routeIds: number[], simpleRoutes: Route[]) {
  const hasDuplicates = new Set(routeIds).size !== routeIds.length;

  if (hasDuplicates) {
    throw new ValidationError(ROUTE_ERRORS.REPEATED_SEGMENTS);
  }

  // Validate all routes exist
  if (simpleRoutes.length !== routeIds.length) {
    const missingRouteIds = routeIds.filter(
      (id) => !simpleRoutes.some((route) => route.id === id),
    );
    throw new ValidationError(ROUTE_ERRORS.ROUTES_NOT_FOUND(missingRouteIds));
  }

  // Validate route connections
  validateRouteConnections(simpleRoutes);
}

function calculateRouteTotals(routes: Route[]) {
  const firstRoute = routes[0];
  const lastRoute = routes[routes.length - 1];

  const totalDistance = routes.reduce((sum, route) => sum + route.distance, 0);
  const totalTravelTime = routes.reduce(
    (sum, route) => sum + route.totalTravelTime,
    0,
  );
  const baseTime = routes.reduce((sum, route) => sum + route.baseTime, 0);

  return {
    firstRoute,
    lastRoute,
    totalDistance,
    totalTravelTime,
    baseTime,
  };
}

/**
 * Creates a compound route from multiple simple routes
 */
async function createCompoundRoute({
  name,
  description,
  routeIds,
}: {
  name: string;
  description: string;
  routeIds: number[];
}) {
  // Get all required routes
  const simpleRoutes = await routeRepository.findSimpleRoutesByIds(routeIds);

  // Validate route IDs and connections
  validateRouteIds(routeIds, simpleRoutes);

  // Order routes according to routeIds
  const simpleRoutesOrdered = routeIds
    .map((id) => simpleRoutes.find((route) => route.id === id))
    .filter((route): route is NonNullable<typeof route> => route !== undefined);

  // Validate minimum number of segments
  if (simpleRoutesOrdered.length < 2) {
    throw new ValidationError(ROUTE_ERRORS.COMPOUND_ROUTE_MINIMUM);
  }

  // Create compound route payload from children
  const compoundRoutePayload = createCompoundRouteFromChildren(
    name,
    description,
    simpleRoutesOrdered,
  );

  // Use a single transaction for the entire operation
  return routeRepository
    .transaction(async (txRouteRepo, tx) => {
      // Create a transaction-scoped version of the routeSegmentRepository
      const txRouteSegmentRepo = routeSegmentRepository.withTransaction(tx);

      // Create the parent route
      const compoundRoute = await txRouteRepo.create(compoundRoutePayload);

      // Create route segments within the same transaction
      try {
        for (const [index, route] of simpleRoutesOrdered.entries()) {
          await txRouteSegmentRepo.create({
            parentRouteId: compoundRoute.id,
            segmentRouteId: route.id,
            sequence: index + 1,
          });
        }
      } catch {
        // We don't need manual cleanup since the transaction will be rolled back automatically
        throw new Error(ROUTE_ERRORS.FAILED_CREATE_SEGMENTS);
      }

      // We need to retrieve the compound route with full details outside the transaction
      // to ensure we have the latest data after the transaction completes
      return compoundRoute.id;
    })
    .then((compoundRouteId) => {
      // After transaction completes successfully, retrieve the route with full details
      return routeRepository.findOneWithFullDetails(compoundRouteId);
    });
}

function validateRouteConnections(routes: Route[]) {
  routes.forEach((route, index) => {
    const nextRoute = routes[index + 1];
    if (!nextRoute) {
      return;
    }

    if (route.destinationCityId !== nextRoute.originCityId) {
      throw new ValidationError(
        ROUTE_ERRORS.INVALID_CONNECTION(route.id, nextRoute.id),
      );
    }
  });
}

function createCompoundRouteFromChildren(
  name: string,
  description: string,
  routes: Route[],
): CreateRoutePayloadWithCityIds {
  if (routes.length < 2) {
    throw new ValidationError(ROUTE_ERRORS.COMPOUND_ROUTE_MINIMUM);
  }

  const firstRoute = routes[0];
  const lastRoute = routes[routes.length - 1];

  // Calculate total distance and time by summing all routes
  const totalDistance = routes.reduce((sum, route) => sum + route.distance, 0);
  const totalTravelTime = routes.reduce(
    (sum, route) => sum + route.totalTravelTime,
    0,
  );
  const baseTime = routes.reduce((sum, route) => sum + route.baseTime, 0);

  return {
    name,
    description,
    originCityId: firstRoute.originCityId,
    destinationCityId: lastRoute.destinationCityId,
    baseTime,
    isCompound: true,
    connectionCount: routes.length - 1,
    distance: totalDistance,
    totalTravelTime,
    totalDistance,
  };
}

/**
 * Updates the segments of an existing compound route
 */
async function updateCompoundRouteSegments({
  compoundRouteId,
  routeIds,
}: {
  compoundRouteId: number;
  routeIds: number[];
}) {
  // If compound route is not found, throw an error
  await routeRepository.findCompoundRoute(compoundRouteId);

  // Get all required routes
  const simpleRoutes = await routeRepository.findSimpleRoutesByIds(routeIds);

  // Validate route IDs and connections
  validateRouteIds(routeIds, simpleRoutes);

  // Order routes according to routeIds
  const simpleRoutesOrdered = routeIds
    .map((id) => simpleRoutes.find((route) => route.id === id))
    .filter((route): route is NonNullable<typeof route> => route !== undefined);

  // Validate minimum number of segments
  if (simpleRoutesOrdered.length < 2) {
    throw new ValidationError(ROUTE_ERRORS.COMPOUND_ROUTE_MINIMUM);
  }

  // Execute the update in a transaction
  return routeRepository
    .transaction(async (txRouteRepo, tx) => {
      // Create a transaction-scoped version of the routeSegmentRepository
      const txRouteSegmentRepo = routeSegmentRepository.withTransaction(tx);

      try {
        // Delete existing segments
        const existingSegments = await txRouteSegmentRepo.findAllBy(
          routeSegments.parentRouteId,
          compoundRouteId,
        );

        for (const segment of existingSegments) {
          await txRouteSegmentRepo.delete(segment.id);
        }

        // Create new segments
        for (const [index, route] of simpleRoutesOrdered.entries()) {
          await txRouteSegmentRepo.create({
            parentRouteId: compoundRouteId,
            segmentRouteId: route.id,
            sequence: index + 1,
          });
        }

        // Calculate and update route totals
        const {
          firstRoute,
          lastRoute,
          totalDistance,
          totalTravelTime,
          baseTime,
        } = calculateRouteTotals(simpleRoutesOrdered);

        await txRouteRepo.update(compoundRouteId, {
          originCityId: firstRoute.originCityId,
          destinationCityId: lastRoute.destinationCityId,
          connectionCount: simpleRoutesOrdered.length - 1,
          totalDistance,
          totalTravelTime,
          baseTime,
        });

        return compoundRouteId;
      } catch {
        // Transaction will be rolled back automatically
        throw new Error(ROUTE_ERRORS.FAILED_REPLACE_SEGMENTS);
      }
    })
    .then((routeId) => {
      // After transaction completes successfully, retrieve the route with full details
      return routeRepository.findOneWithFullDetails(routeId);
    });
}

export const createRouteUseCases = () => {
  return {
    createSimpleRoute,
    createCompoundRoute,
    updateCompoundRouteSegments,
  };
};

export const routeUseCases = createRouteUseCases();
