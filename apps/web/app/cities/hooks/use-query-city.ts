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
 */
export default function useQueryCity({
  cityId,
  enabled = true,
}: UseQueryCityProps): UseQueryResult<cities.City, QueryCityError> {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['cities', cityId],
    enabled,
    queryFn: () => imsClient.inventory.getCity(cityId),
    initialData: () =>
      queryClient
        .getQueryData<cities.PaginatedCities>(['cities'])
        ?.data.find((city) => city.id === cityId),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState<cities.City[]>(['cities'])?.dataUpdatedAt,
  });
}
