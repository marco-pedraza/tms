import { APIError, states } from '@repo/ims-client';
import createCollectionQuery from '@/hooks/use-query-collection';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a paginated list of states.
 *
 * This hook provides a reusable query for fetching states with pagination.
 * It handles query setup, caching, and error handling.
 */
export default createCollectionQuery<
  states.State,
  states.PaginatedStates,
  APIError
>({
  queryKey: ['states'],
  queryFn: (params) => imsClient.inventory.listStatesPaginated(params),
});
