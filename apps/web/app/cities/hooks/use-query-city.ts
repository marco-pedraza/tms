import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import type { cities } from '@repo/ims-client';
import imsClient from '@/lib/ims-client';

interface UseQueryCityProps {
  cityId: number;
  enabled?: boolean;
}

type QueryCityError = Error;

/**
 * Custom hook for querying a city by ID.
 *
 * This hook provides a reusable query for fetching a city by its ID.
 * It handles query setup, caching, and error handling.
 *
 * @param props - The properties for configuring the query
 * @param props.cityId - The ID of the city to fetch
 * @param props.enabled - Whether the query should execute (defaults to true)
 * @returns The query result containing city data, loading state, and error state
 */
export default function useQueryCity({
  cityId,
  enabled = true,
}: UseQueryCityProps): UseQueryResult<cities.City, QueryCityError> {
  return useQuery({
    queryKey: ['cities', cityId],
    queryFn: async () => {
      if (!cityId || isNaN(cityId)) {
        throw new Error('Invalid city ID');
      }
      return await imsClient.inventory.getCity(cityId);
    },
    enabled: enabled && Boolean(cityId) && !isNaN(cityId),
  });
}
