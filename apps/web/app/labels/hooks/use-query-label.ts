import type { APIError, labels } from '@repo/ims-client';
import createCollectionItemQuery from '@/hooks/use-query-collection-item';
import imsClient from '@/services/ims-client';

export default createCollectionItemQuery<
  labels.LabelWithNodeCount,
  labels.PaginatedListLabelsResult,
  APIError
>({
  collectionQueryKey: ['labels'],
  queryFn: (labelId) => imsClient.inventory.getLabel(labelId),
});
