import type { APIError, technologies } from '@repo/ims-client';
import createCollectionItemQuery from '@/hooks/use-query-collection-item';
import imsClient from '@/services/ims-client';

export default createCollectionItemQuery<
  technologies.Technology,
  technologies.PaginatedListTechnologiesResult,
  APIError
>({
  collectionQueryKey: ['technologies'],
  queryFn: (technologyId) => imsClient.inventory.getTechnology(technologyId),
});
