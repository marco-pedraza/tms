import type { APIError, bus_models } from '@repo/ims-client';
import createCollectionQuery from '@/hooks/use-query-collection';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a paginated list of bus models.
 *
 * This hook provides a reusable query for fetching bus models with pagination.
 * It handles query setup, caching, and error handling.
 */
export default createCollectionQuery<
  bus_models.BusModel,
  bus_models.PaginatedListBusModelsResult,
  APIError
>({
  queryKey: ['busModels'],
  queryFn: (params) => imsClient.inventory.listBusModelsPaginated(params),
});
