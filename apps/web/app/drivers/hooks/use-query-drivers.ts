import type { APIError, drivers } from '@repo/ims-client';
import createCollectionQuery from '@/hooks/use-query-collection';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a paginated list of drivers.
 *
 * This hook provides a reusable query for fetching drivers with pagination.
 * It handles query setup, caching, and error handling.
 */
export default createCollectionQuery<
  drivers.Driver,
  drivers.PaginatedListDriversResult,
  APIError
>({
  queryKey: ['drivers'],
  queryFn: (params) => imsClient.inventory.listDriversPaginated(params),
});
