import type { APIError, countries } from '@repo/ims-client';
import createCollectionQuery from '@/hooks/use-query-collection';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a paginated list of countries.
 *
 * This hook provides a reusable query for fetching countries with pagination.
 * It handles query setup, caching, and error handling.
 */
export default createCollectionQuery<
  countries.Country,
  countries.PaginatedListCountriesResult,
  APIError
>({
  queryKey: ['countries'],
  queryFn: (params) => imsClient.inventory.listCountriesPaginated(params),
});
