import type { APIError, cities } from '@repo/ims-client';
import createCollectionQuery from '@/hooks/use-query-collection';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a paginated list of cities.
 *
 * This hook provides a reusable query for fetching cities with pagination.
 * It handles query setup, caching, and error handling.
 */
export default createCollectionQuery<
  cities.City,
  cities.PaginatedListCitiesResult,
  APIError
>({
  queryKey: ['cities'],
  queryFn: (params) => imsClient.inventory.listCitiesPaginated(params),
});
