import type { APIError, populations } from '@repo/ims-client';
import createCollectionQuery from '@/hooks/use-query-collection';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a paginated list of populations.
 *
 * This hook provides a reusable query for fetching populations with pagination.
 * It handles query setup, caching, and error handling.
 */
export default createCollectionQuery<
  populations.Population,
  populations.PaginatedListPopulationsResult,
  APIError
>({
  queryKey: ['populations'],
  queryFn: (params) => imsClient.inventory.listPopulationsPaginated(params),
});
