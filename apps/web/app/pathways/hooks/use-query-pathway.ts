import type { APIError, pathways } from '@repo/ims-client';
import createCollectionItemQuery from '@/hooks/use-query-collection-item';
import imsClient from '@/services/ims-client';

export default createCollectionItemQuery<
  pathways.Pathway,
  pathways.PaginatedListPathwaysResult,
  APIError
>({
  collectionQueryKey: ['pathways'],
  queryFn: (pathwayId) => imsClient.inventory.getPathway(pathwayId),
});
