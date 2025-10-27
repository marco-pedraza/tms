import { type TransactionalDB } from '@repo/base-repo';
import { nodeRepository } from '@/inventory/locations/nodes/nodes.repository';
import { busLineRepository } from '@/inventory/operators/bus-lines/bus-lines.repository';
import { serviceTypeRepository } from '@/inventory/operators/service-types/service-types.repository';
import { pathwayOptionRepository } from '@/inventory/routing/pathway-options/pathway-options.repository';
import { pathwayRepository } from '@/inventory/routing/pathways/pathways.repository';
import { routeLegsRepository } from '@/inventory/routing/route-legs/route-legs.repository';
import type {
  CreateRoutePayload,
  Route,
  RouteEnriched,
  UpdateRoutePayload,
} from './routes.types';
import { routesRepository } from './routes.repository';
import { createRouteEntity } from './route.entity';

/**
 * Application service for route operations
 */
export function createRouteApplicationService() {
  /**
   * Executes an operation within a transaction using a transactional route entity
   * @param operation - The operation to execute with the transactional entity
   * @returns The result of the operation
   */
  function withTransaction<T>(
    operation: (
      routeEntityInstance: ReturnType<typeof createRouteEntity>,
      tx: TransactionalDB,
    ) => Promise<T>,
  ): Promise<T> {
    return routesRepository.transaction(async (txRoutesRepo, tx) => {
      // Create transactional route entity
      const txRouteEntity = createRouteEntity({
        routesRepository: {
          create: (
            payload: Omit<CreateRoutePayload, 'legs'> & {
              originCityId: number;
              destinationCityId: number;
            },
          ) => txRoutesRepo.create({ ...payload, legs: [] }),
          update: txRoutesRepo.update,
          findOne: txRoutesRepo.findOne,
        },
        nodeRepository,
        pathwayRepository,
        pathwayOptionRepository,
        busLineRepository,
        serviceTypeRepository,
        routeLegsRepository,
      });

      return await operation(txRouteEntity, tx);
    });
  }

  /**
   * Creates a new route with legs
   * Routes must have at least one leg, so creation is atomic (route + legs in transaction)
   * @param payload - The route creation data
   * @returns The created route
   * @throws {FieldValidationError} If validation fails
   * @throws {NotFoundError} If referenced entities are not found
   */
  function createRoute(payload: CreateRoutePayload): Promise<RouteEnriched> {
    // Routes require atomic creation (route + legs), so we use explicit transaction
    return withTransaction(async (txRouteEntity, tx) => {
      const route = txRouteEntity.create(payload);
      const savedRoute = await route.save(tx);
      return savedRoute.toRoute();
    }).then((routeData) => {
      // Fetch enriched data after transaction completes
      return routesRepository.findRouteEnriched(routeData.id);
    });
  }

  /**
   * Updates an existing route with validation
   * @param id - The route ID to update
   * @param payload - The route update data
   * @returns The updated route
   * @throws {FieldValidationError} If validation fails
   * @throws {NotFoundError} If route is not found
   */
  function updateRoute(
    id: number,
    payload: UpdateRoutePayload,
  ): Promise<RouteEnriched> {
    // Always use transaction for consistency with create operation
    return withTransaction(async (txRouteEntity, tx) => {
      const route = await txRouteEntity.findOne(id);
      const updated = await route.update(payload, tx);
      return updated.toRoute();
    }).then((routeData) => {
      // Fetch enriched data after transaction completes
      return routesRepository.findRouteEnriched(routeData.id);
    });
  }

  /**
   * Deletes a route by its ID (soft delete)
   * @param id - The route ID to delete
   * @returns The deleted route
   * @throws {NotFoundError} If route is not found
   */
  async function deleteRoute(id: number): Promise<Route> {
    // TODO: Add validation to check if the route has any future departures
    return await routesRepository.delete(id);
  }

  return {
    createRoute,
    updateRoute,
    deleteRoute,
  };
}

export const routeApplicationService = createRouteApplicationService();
