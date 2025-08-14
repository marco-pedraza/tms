import type { APIError, service_types } from '@repo/ims-client';
import createCollectionItemQuery from '@/hooks/use-query-collection-item';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a service type by its ID.
 *
 * This hook provides a reusable query for fetching a service type by its ID.
 * It handles query setup, caching, and error handling.
 */
export default createCollectionItemQuery<
  service_types.ServiceType,
  service_types.PaginatedListServiceTypesResult,
  APIError
>({
  collectionQueryKey: ['service-types'],
  queryFn: (serviceTypeId) => imsClient.inventory.getServiceType(serviceTypeId),
});
