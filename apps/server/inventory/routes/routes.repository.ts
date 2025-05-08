import { routes } from './routes.schema';
import { routeSegments } from '../route-segment/route-segment.schema';
import type {
  Route,
  CreateRoutePayload,
  UpdateRoutePayload,
  RouteWithFullDetails,
} from './routes.types';
import { createBaseRepository, NotFoundError } from '@repo/base-repo';
import { db } from '../db-service';
import { eq, and, asc, inArray } from 'drizzle-orm';

/**
 * Creates a repository for managing routes
 *
 * @returns {Object} An object containing route operations
 */
export const createRouteRepository = () => {
  const baseRepository = createBaseRepository<
    Route,
    CreateRoutePayload,
    UpdateRoutePayload,
    typeof routes
  >(db, routes, 'Route', {
    searchableFields: [routes.name],
  });

  const findOneWithFullDetails = async (
    id: number,
  ): Promise<RouteWithFullDetails> => {
    const result = await db.query.routes.findFirst({
      where: eq(routes.id, id),
      with: {
        originCity: true,
        destinationCity: true,
        destinationTerminal: true,
        originTerminal: true,
        pathway: true,
        routeSegments: {
          orderBy: [asc(routeSegments.sequence)],
        },
      },
    });

    if (!result) {
      throw new NotFoundError(`Route with id ${id} not found`);
    }

    return result;
  };

  /**
   * Finds multiple simple (non-compound) routes by their IDs
   *
   * @param ids - Array of route IDs to search for
   * @returns Array of simple routes matching the provided IDs
   */
  const findSimpleRoutesByIds = async (ids: number[]) => {
    const result = await db.query.routes.findMany({
      where: and(eq(routes.isCompound, false), inArray(routes.id, ids)),
    });

    return result;
  };

  const findCompoundRoute = async (id: number) => {
    const result = await db.query.routes.findFirst({
      where: and(eq(routes.id, id), eq(routes.isCompound, true)),
      with: {
        routeSegments: {
          orderBy: [asc(routeSegments.sequence)],
        },
      },
    });

    if (!result) {
      throw new NotFoundError(`Compound route with id ${id} not found`);
    }

    return result;
  };

  return {
    ...baseRepository,
    findOneWithFullDetails,
    findCompoundRoute,
    findSimpleRoutesByIds,
  };
};

export const routeRepository = createRouteRepository();
