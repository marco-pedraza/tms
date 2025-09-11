import type { APIError, bus_models } from '@repo/ims-client';
import createCollectionItemQuery from '@/hooks/use-query-collection-item';
import imsClient from '@/services/ims-client';

// Create a compatible type for the paginated result with details
type PaginatedListBusModelsWithDetailsResult = Omit<
  bus_models.PaginatedListBusModelsResult,
  'data'
> & {
  data: bus_models.BusModelWithDetails[];
};

export default createCollectionItemQuery<
  bus_models.BusModelWithDetails,
  PaginatedListBusModelsWithDetailsResult,
  APIError
>({
  collectionQueryKey: ['busModels'],
  queryFn: (busModelId) => imsClient.inventory.getBusModel(busModelId),
});
