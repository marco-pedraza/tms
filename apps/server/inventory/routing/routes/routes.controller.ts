import { api } from 'encore.dev/api';
import type {
  CreateRoutePayload,
  ListRoutesQueryParams,
  ListRoutesResult,
  PaginatedListRoutesQueryParams,
  PaginatedListRoutesResult,
  Route,
  RouteEnriched,
  UpdateRoutePayload,
} from './routes.types';
import { routesRepository } from './routes.repository';
import { routeApplicationService } from './routes.application-service';

/**
 * Creates a new route with legs.
 * @param params - The route data to create
 * @returns {Promise<RouteEnriched>} The created route
 * @throws {APIError} If the route creation fails
 */
export const createRoute = api(
  {
    expose: true,
    method: 'POST',
    path: '/routes/create',
    auth: true,
  },
  async (params: CreateRoutePayload): Promise<RouteEnriched> => {
    return await routeApplicationService.createRoute(params);
  },
);

/**
 * Retrieves a route by its ID with enriched data.
 * @param params - Object containing the route ID
 * @param params.id - The ID of the route to retrieve
 * @returns {Promise<RouteEnriched>} The found route with enriched data
 * @throws {APIError} If the route is not found or retrieval fails
 */
export const getRoute = api(
  {
    expose: true,
    method: 'GET',
    path: '/routes/:id',
    auth: true,
  },
  async ({ id }: { id: number }): Promise<RouteEnriched> => {
    return await routesRepository.findRouteEnriched(id);
  },
);

/**
 * Retrieves all routes without pagination (useful for dropdowns).
 * @param params - Query parameters including orderBy, filters, and searchTerm
 * @returns {Promise<ListRoutesResult>} Unified response with data property containing array of routes
 * @throws {APIError} If retrieval fails
 */
export const listRoutes = api(
  {
    expose: true,
    method: 'POST',
    path: '/routes/list/all',
    auth: true,
  },
  async (params: ListRoutesQueryParams): Promise<ListRoutesResult> => {
    const routes = await routesRepository.findAll(params);
    return {
      data: routes,
    };
  },
);

/**
 * Retrieves routes with pagination and filters.
 * @param params - Pagination and query parameters including page, pageSize, orderBy, filters, and searchTerm
 * @returns {Promise<PaginatedListRoutesResult>} Unified paginated response with data and pagination properties
 * @throws {APIError} If retrieval fails
 */
export const listRoutesPaginated = api(
  {
    expose: true,
    method: 'POST',
    path: '/routes/list',
    auth: true,
  },
  async (
    params: PaginatedListRoutesQueryParams,
  ): Promise<PaginatedListRoutesResult> => {
    return await routesRepository.findAllPaginatedWithRelations(params);
  },
);

/**
 * Updates an existing route.
 * @param params - Object containing the route ID and update data
 * @param params.id - The ID of the route to update
 * @returns {Promise<RouteEnriched>} The updated route
 * @throws {APIError} If the route is not found or update fails
 */
export const updateRoute = api(
  {
    expose: true,
    method: 'PUT',
    path: '/routes/:id/update',
    auth: true,
  },
  async ({
    id,
    ...data
  }: UpdateRoutePayload & { id: number }): Promise<RouteEnriched> => {
    return await routeApplicationService.updateRoute(id, data);
  },
);

/**
 * Deletes a route by its ID.
 * @param params - Object containing the route ID
 * @param params.id - The ID of the route to delete
 * @returns {Promise<Route>} The deleted route
 * @throws {APIError} If the route is not found or deletion fails
 */
export const deleteRoute = api(
  {
    expose: true,
    method: 'DELETE',
    path: '/routes/:id/delete',
    auth: true,
  },
  async ({ id }: { id: number }): Promise<Route> => {
    return await routeApplicationService.deleteRoute(id);
  },
);
