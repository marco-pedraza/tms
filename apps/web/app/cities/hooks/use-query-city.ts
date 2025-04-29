import {
  type UseQueryResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { cities } from '@repo/ims-client';
import imsClient from '@/lib/ims-client';

interface UseQueryCityProps {
  cityId: number;
  enabled?: boolean;
}

type QueryCityError = Error;

/**
 * Custom hook for querying a city by ID with cache integration.
 *
 * This hook first attempts to retrieve the city from the collection cache,
 * then fetches the complete city data from the API.
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
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['cities', cityId],
    queryFn: async () => {
      if (!cityId || isNaN(cityId)) {
        throw new Error('Invalid city ID');
      }
      return await imsClient.inventory.getCity(cityId);
    },
    enabled: enabled && Boolean(cityId) && !isNaN(cityId),
    // Try to get initial data from the collection cache
    initialData: () =>
      queryClient
        .getQueryData<cities.PaginatedCities>(['cities'])
        ?.data.find((city) => city.id === cityId),
    // Tell React Query when the initialData was last updated
    initialDataUpdatedAt: () =>
      queryClient.getQueryState<cities.City[]>(['cities'])?.dataUpdatedAt,
  });
}
