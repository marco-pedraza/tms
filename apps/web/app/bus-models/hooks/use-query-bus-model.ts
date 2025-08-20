import type { APIError, bus_models } from '@repo/ims-client';
import createCollectionItemQuery from '@/hooks/use-query-collection-item';
import imsClient from '@/services/ims-client';

export default createCollectionItemQuery<
  bus_models.BusModel,
  bus_models.PaginatedListBusModelsResult,
  APIError
>({
  collectionQueryKey: ['busModels'],
  queryFn: (busModelId) => imsClient.inventory.getBusModel(busModelId),
});
