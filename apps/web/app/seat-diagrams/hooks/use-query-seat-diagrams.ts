import { APIError, bus_diagram_models } from '@repo/ims-client';
import createCollectionQuery from '@/hooks/use-query-collection';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a paginated list of seat diagrams (bus diagram models).
 *
 * This hook provides a reusable query for fetching seat diagrams with pagination.
 * It handles query setup, caching, and error handling.
 */
export default createCollectionQuery<
  bus_diagram_models.BusDiagramModel,
  bus_diagram_models.PaginatedListBusDiagramModelsResult,
  APIError
>({
  queryKey: ['seatDiagrams'],
  queryFn: (params) =>
    imsClient.inventory.listBusDiagramModelsPaginated(params),
});
