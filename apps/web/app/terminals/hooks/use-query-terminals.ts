import type { APIError, terminals } from '@repo/ims-client';
import createCollectionQuery from '@/hooks/use-query-collection';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a paginated list of terminals.
 *
 * This hook provides a reusable query for fetching terminals with pagination.
 * It handles query setup, caching, and error handling.
 */
export default createCollectionQuery<
  terminals.Terminal,
  terminals.PaginatedTerminals,
  APIError
>({
  queryKey: ['terminals'],
  queryFn: (params) => imsClient.inventory.listTerminalsPaginated(params),
});
