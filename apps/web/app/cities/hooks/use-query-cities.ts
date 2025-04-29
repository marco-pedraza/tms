import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import type { cities } from '@repo/ims-client';
import imsClient from '@/lib/ims-client';

interface UseQueryCitiesProps {
  enabled?: boolean;
}

type QueryCitiesError = Error;

/**
 * Custom hook for querying a paginated list of cities.
 *
 * This hook provides a reusable query for fetching cities with pagination.
 * It handles query setup, caching, and error handling.
 *
 * @param props - The properties for configuring the query
 * @param props.enabled - Whether the query should execute (defaults to true)
 * @returns The query result containing paginated cities data, loading state, and error state
 */
export default function useQueryCities({
  enabled = true,
}: UseQueryCitiesProps = {}): UseQueryResult<
  cities.PaginatedCities,
  QueryCitiesError
> {
  return useQuery({
    queryKey: ['cities'],
    queryFn: async () => await imsClient.inventory.listCitiesPaginated({}),
    enabled,
  });
}
