import type { APIError, routes } from '@repo/ims-client';
import createCollectionQuery from '@/hooks/use-query-collection';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a paginated list of routes.
 *
 * This hook provides a reusable query for fetching routes with pagination.
 * It handles query setup, caching, and error handling.
 */
export default createCollectionQuery<
  routes.Route,
  routes.PaginatedListRoutesResult,
  APIError
>({
  queryKey: ['routes'],
  queryFn: (params) => imsClient.inventory.listRoutesPaginated(params),
});
