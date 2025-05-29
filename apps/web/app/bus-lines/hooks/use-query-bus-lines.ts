import type { APIError, bus_lines } from '@repo/ims-client';
import createCollectionQuery from '@/hooks/use-query-collection';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a paginated list of bus lines.
 *
 * This hook provides a reusable query for fetching bus lines with pagination.
 * It handles query setup, caching, and error handling.
 */
export default createCollectionQuery<
  bus_lines.BusLine,
  bus_lines.PaginatedBusLines,
  APIError
>({
  queryKey: ['busLines'],
  queryFn: (params) => imsClient.inventory.listBusLinesPaginated(params),
});
