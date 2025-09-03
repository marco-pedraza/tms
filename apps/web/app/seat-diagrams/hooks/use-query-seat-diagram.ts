import type { APIError, bus_diagram_models } from '@repo/ims-client';
import createCollectionItemQuery from '@/hooks/use-query-collection-item';
import imsClient from '@/services/ims-client';

export default createCollectionItemQuery<
  bus_diagram_models.BusDiagramModel,
  bus_diagram_models.PaginatedListBusDiagramModelsResult,
  APIError
>({
  collectionQueryKey: ['seatDiagrams'],
  queryFn: (itemId) => imsClient.inventory.getBusDiagramModel(itemId),
});
