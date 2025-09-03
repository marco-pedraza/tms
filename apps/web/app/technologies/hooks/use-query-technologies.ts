import type { APIError, technologies } from '@repo/ims-client';
import createCollectionQuery from '@/hooks/use-query-collection';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a paginated list of technologies.
 *
 * This hook provides a reusable query for fetching technologies with pagination.
 * It handles query setup, caching, and error handling.
 */
export default createCollectionQuery<
  technologies.Technology,
  technologies.PaginatedListTechnologiesResult,
  APIError
>({
  queryKey: ['technologies'],
  queryFn: (params) => imsClient.inventory.listTechnologiesPaginated(params),
});
