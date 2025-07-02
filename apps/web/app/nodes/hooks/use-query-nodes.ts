import type { APIError, nodes } from '@repo/ims-client';
import createCollectionQuery from '@/hooks/use-query-collection';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a paginated list of nodes.
 *
 * This hook provides a reusable query for fetching nodes with pagination.
 * It handles query setup, caching, and error handling.
 */
export default createCollectionQuery<
  nodes.Node,
  nodes.PaginatedListNodesResult,
  APIError
>({
  queryKey: ['nodes'],
  queryFn: (params) => imsClient.inventory.listNodesPaginated(params),
});
