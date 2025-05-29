import type { APIError, service_types } from '@repo/ims-client';
import createCollectionQuery from '@/hooks/use-query-collection';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a paginated list of service types.
 *
 * This hook provides a reusable query for fetching service types with pagination.
 * It handles query setup, caching, and error handling.
 */
export default createCollectionQuery<
  service_types.ServiceType,
  service_types.PaginatedServiceTypes,
  APIError
>({
  queryKey: ['serviceTypes'],
  queryFn: (params) => imsClient.inventory.listServiceTypesPaginated(params),
});
