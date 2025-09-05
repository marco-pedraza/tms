import type { APIError, chromatics } from '@repo/ims-client';
import createCollectionQuery from '@/hooks/use-query-collection';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a paginated list of chromatics.
 *
 * This hook provides a reusable query for fetching chromatics with pagination.
 * It handles query setup, caching, and error handling.
 */
export default createCollectionQuery<
  chromatics.Chromatic,
  chromatics.PaginatedListChromaticsResult,
  APIError
>({
  queryKey: ['chromatics'],
  queryFn: (params) => imsClient.inventory.listChromaticsPaginated(params),
});
