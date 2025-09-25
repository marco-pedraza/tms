import type { APIError, pathways } from '@repo/ims-client';
import createCollectionQuery from '@/hooks/use-query-collection';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a paginated list of pathways.
 *
 * This hook provides a reusable query for fetching pathways with pagination.
 * It handles query setup, caching, and error handling.
 */
export default createCollectionQuery<
  pathways.Pathway,
  pathways.PaginatedListPathwaysResult,
  APIError
>({
  queryKey: ['pathways'],
  queryFn: (params) => imsClient.inventory.listPathwaysPaginated(params),
});
