import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { countries } from '@repo/ims-client';
import imsClient from '@/lib/ims-client';

type QueryCountriesError = Error;

/**
 * Custom hook for querying a paginated list of countries.
 *
 * This hook provides a reusable query for fetching countries with pagination.
 * It handles query setup, caching, and error handling.
 */
export default function useQueryCountries(): UseQueryResult<
  countries.PaginatedCountries,
  QueryCountriesError
> {
  return useQuery({
    queryKey: ['countries'],
    queryFn: async () => await imsClient.inventory.listCountriesPaginated({}),
  });
}
