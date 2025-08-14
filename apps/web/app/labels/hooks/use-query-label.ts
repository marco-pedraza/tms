import type { APIError, labels } from '@repo/ims-client';
import createCollectionItemQuery from '@/hooks/use-query-collection-item';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a label by its ID.
 *
 * This hook provides a reusable query for fetching a label by its ID.
 * It handles query setup, caching, and error handling.
 */
export default createCollectionItemQuery<
  labels.LabelWithNodeCount,
  labels.PaginatedListLabelsResult,
  APIError
>({
  collectionQueryKey: ['labels'],
  queryFn: (labelId) => imsClient.inventory.getLabel(labelId),
});
