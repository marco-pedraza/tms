import type { APIError, buses } from '@repo/ims-client';
import createCollectionQuery from '@/hooks/use-query-collection';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a paginated list of buses.
 *
 * This hook provides a reusable query for fetching buses with pagination.
 * It handles query setup, caching, and error handling.
 */
export default createCollectionQuery<
  buses.Bus,
  buses.PaginatedListBusesResult,
  APIError
>({
  queryKey: ['buses'],
  queryFn: (params) => imsClient.inventory.listBusesPaginated(params),
});
