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

interface QueryCityError extends Error {
  code?: string;
  status?: number;
}

/**
 * Custom hook for querying a city by ID with cache integration
 *
 * Uses the collection cache as initial data for immediate rendering
 * while fetching the complete data in the background
 */
export default function useQueryCity({
  cityId,
  enabled = true,
}: UseQueryCityProps): UseQueryResult<cities.City, QueryCityError> {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['cities', cityId],
    queryFn: () => imsClient.inventory.getCity(cityId),
    enabled,
    initialData: () =>
      queryClient
        .getQueryData<cities.PaginatedCities>(['cities'])
        ?.data.find((city) => city.id === cityId),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState<cities.City[]>(['cities'])?.dataUpdatedAt,
  });
}
