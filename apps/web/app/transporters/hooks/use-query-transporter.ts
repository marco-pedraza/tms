import type { APIError, transporters } from '@repo/ims-client';
import createCollectionItemQuery from '@/hooks/use-query-collection-item';
import imsClient from '@/services/ims-client';

export default createCollectionItemQuery<
  transporters.TransporterWithCity,
  transporters.PaginatedListTransportersResult,
  APIError
>({
  collectionQueryKey: ['transporters'],
  queryFn: (itemId) => imsClient.inventory.getTransporter(itemId),
});
