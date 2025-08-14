import type { APIError, transporters } from '@repo/ims-client';
import createCollectionQuery from '@/hooks/use-query-collection';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a paginated list of transporters.
 *
 * This hook provides a reusable query for fetching transporters with pagination.
 * It handles query setup, caching, and error handling.
 */
export default createCollectionQuery<
  transporters.Transporter,
  transporters.PaginatedListTransportersResult,
  APIError
>({
  queryKey: ['transporters'],
  queryFn: (params) => imsClient.inventory.listTransportersPaginated(params),
});
