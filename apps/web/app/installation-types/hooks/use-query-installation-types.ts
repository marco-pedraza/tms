import type { APIError, installation_types } from '@repo/ims-client';
import createCollectionQuery from '@/hooks/use-query-collection';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a paginated list of installation types.
 *
 * This hook provides a reusable query for fetching installation types with pagination.
 * It handles query setup, caching, and error handling.
 */
export default createCollectionQuery<
  installation_types.InstallationType,
  installation_types.PaginatedListInstallationTypesResult,
  APIError
>({
  queryKey: ['installationTypes'],
  queryFn: (params) =>
    imsClient.inventory.listInstallationTypesPaginated(params),
});
