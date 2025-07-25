import type { APIError, labels } from '@repo/ims-client';
import createCollectionQuery from '@/hooks/use-query-collection';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a paginated list of labels.
 *
 * This hook provides a reusable query for fetching labels with pagination.
 * It handles query setup, caching, and error handling.
 */
export default createCollectionQuery<
  labels.Label,
  labels.PaginatedListLabelsResult,
  APIError
>({
  queryKey: ['labels'],
  queryFn: (params) => imsClient.inventory.listLabelsPaginated(params),
});
