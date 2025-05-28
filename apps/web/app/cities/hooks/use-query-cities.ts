import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import type { cities } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

type QueryCitiesError = Error;

/**
 * Custom hook for querying a paginated list of cities.
 *
 * This hook provides a reusable query for fetching cities with pagination.
 * It handles query setup, caching, and error handling.
 *
 */
export default function useQueryCities(): UseQueryResult<
  cities.Cities,
  QueryCitiesError
> {
  return useQuery({
    queryKey: ['cities'],
    queryFn: async () => await imsClient.inventory.listCities({}),
  });
}
