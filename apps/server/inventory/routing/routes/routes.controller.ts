import { api } from 'encore.dev/api';
import {
  CreateSimpleRoutePayload,
  PaginatedRoutes,
  PaginationParamsRoutes,
  Route,
  RouteWithFullDetails,
  Routes,
  RoutesQueryOptions,
} from './routes.types';
import { routeRepository } from './routes.repository';
import { routeUseCases } from './routes.use-cases';

/**
 * Retrieves a route by its ID.
 * @param params - Object containing the route ID
 * @param params.id - The ID of the route to retrieve
 * @returns {Promise<Route>} The found route
 * @throws {APIError} If the route is not found or retrieval fails
 */
export const getRoute = api(
  { method: 'GET', path: '/routes/:id', expose: true },
  async ({ id }: { id: number }): Promise<Route> => {
    return await routeRepository.findOne(id);
  },
);

/**
 * Retrieves a route by its ID with all related details.
 * @param params - Object containing the route ID
 * @param params.id - The ID of the route to retrieve
 * @returns {Promise<RouteWithFullDetails>} The found route with full details
 * @throws {APIError} If the route is not found or retrieval fails
 */
export const getRouteWithFullDetails = api(
  { method: 'GET', path: '/routes/:id/details', expose: true },
  async ({ id }: { id: number }): Promise<RouteWithFullDetails> => {
    return await routeRepository.findOneWithFullDetails(id);
  },
);

/**
 * Retrieves all routes without pagination (useful for dropdowns).
 * @returns {Promise<Routes>} An object containing an array of routes
 * @throws {APIError} If retrieval fails
 */
export const listRoutes = api(
  { method: 'POST', path: '/get-routes', expose: true },
  async (params: RoutesQueryOptions): Promise<Routes> => {
    const routes = await routeRepository.findAll(params);
    return {
      routes,
    };
  },
);

/**
 * Retrieves routes with pagination (useful for tables).
 * @param params - Pagination parameters
 * @returns {Promise<PaginatedRoutes>} Paginated list of routes
 * @throws {APIError} If retrieval fails
 */
export const listRoutesPaginated = api(
  { method: 'POST', path: '/get-routes/paginated', expose: true },
  async (params: PaginationParamsRoutes): Promise<PaginatedRoutes> => {
    return await routeRepository.findAllPaginated(params);
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
  { method: 'DELETE', path: '/routes/:id', expose: true },
  async ({ id }: { id: number }): Promise<Route> => {
    return await routeRepository.delete(id);
  },
);

/**
 * Searches for routes by matching a search term against name and description.
 * @param params - Search parameters
 * @param params.term - The search term to match against route name and description
 * @returns {Promise<Routes>} List of matching routes
 * @throws {APIError} If search fails or no searchable fields are configured
 */
export const searchRoutes = api(
  { method: 'GET', path: '/routes/search', expose: true },
  async ({ term }: { term: string }): Promise<Routes> => {
    const routes = await routeRepository.search(term);
    return {
      routes,
    };
  },
);

/**
 * Searches for routes with pagination by matching a search term against name and description.
 * @param params - Search and pagination parameters
 * @param params.term - The search term to match against route name and description
 * @param params.page - Page number for pagination (optional, default: 1)
 * @param params.pageSize - Number of items per page (optional, default: 10)
 * @param params.orderBy - Sorting criteria (optional)
 * @param params.filters - Additional filters to apply (optional)
 * @returns {Promise<PaginatedRoutes>} Paginated list of matching routes
 * @throws {APIError} If search fails or no searchable fields are configured
 */
export const searchRoutesPaginated = api(
  { method: 'POST', path: '/routes/search/paginated', expose: true },
  async ({
    term,
    ...params
  }: PaginationParamsRoutes & {
    term: string;
  }): Promise<PaginatedRoutes> => {
    return await routeRepository.searchPaginated(term, params);
  },
);

/**
 * Creates a new simple route with its related pathway.
 * @param params - The data for creating the route and pathway
 * @returns {Promise<Route>} The created route
 * @throws {APIError} If creation fails
 */
export const createRoute = api(
  { method: 'POST', path: '/routes', expose: true },
  async (params: CreateSimpleRoutePayload): Promise<Route> => {
    return await routeUseCases.createSimpleRoute(params);
  },
);

/**
 * Creates a new compound route by connecting multiple existing routes.
 * @param params - Data for creating a compound route
 * @param params.name - Name of the compound route
 * @param params.description - Description of the compound route
 * @param params.routeIds - Array of route IDs to connect in sequence
 * @returns {Promise<RouteWithFullDetails>} The created compound route with full details
 * @throws {APIError} If creation fails, routes don't exist, or connections are invalid
 */
export const createCompoundRoute = api(
  { method: 'POST', path: '/routes/compound', expose: true },
  async (params: {
    name: string;
    description: string;
    routeIds: number[];
  }): Promise<RouteWithFullDetails> => {
    return await routeUseCases.createCompoundRoute(params);
  },
);

/**
 * Updates the segments of an existing compound route.
 * @param params - Data for updating compound route segments
 * @param params.compoundRouteId - ID of the compound route to update
 * @param params.routeIds - Array of route IDs to connect in sequence
 * @returns {Promise<RouteWithFullDetails>} The updated compound route with full details
 * @throws {APIError} If update fails, routes don't exist, or connections are invalid
 */
export const updateCompoundRouteSegments = api(
  {
    method: 'PUT',
    path: '/routes/compound/:compoundRouteId/segments',
    expose: true,
  },
  async (params: {
    compoundRouteId: number;
    routeIds: number[];
  }): Promise<RouteWithFullDetails> => {
    return await routeUseCases.updateCompoundRouteSegments(params);
  },
);
