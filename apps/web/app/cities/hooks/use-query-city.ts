import {
  type UseQueryResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { cities } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

interface QueryCityError extends Error {
  code?: string;
  status?: number;
}

interface UseQueryCityProps {
  cityId: number;
  enabled?: boolean;
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
    enabled,
    queryFn: () => imsClient.inventory.getCity(cityId),
    initialData: () =>
      queryClient
        .getQueryData<cities.PaginatedListCitiesResult>(['cities'])
        ?.data.find((city) => city.id === cityId),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState<cities.PaginatedListCitiesResult>(['cities'])
        ?.dataUpdatedAt,
  });
}
