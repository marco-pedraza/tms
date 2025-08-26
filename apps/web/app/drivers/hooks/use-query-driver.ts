import type { APIError, drivers } from '@repo/ims-client';
import createCollectionItemQuery from '@/hooks/use-query-collection-item';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a single driver by ID.
 *
 * This hook provides a reusable query for fetching individual drivers.
 * It handles query setup, caching, and error handling.
 */
export default createCollectionItemQuery<
  drivers.DriverWithRelations,
  drivers.PaginatedListDriversResult,
  APIError
>({
  collectionQueryKey: ['drivers'],
  queryFn: (driverId) => imsClient.inventory.getDriver(driverId),
});
