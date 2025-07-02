import {
  type UseQueryResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { APIError, populations } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

interface UseQueryPopulationParams {
  populationId: number;
  enabled?: boolean;
}

/**
 * Hook to fetch a single population by ID
 */
export default function useQueryPopulation({
  populationId,
  enabled = true,
}: UseQueryPopulationParams): UseQueryResult<populations.Population, APIError> {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['populations', populationId],
    queryFn: () => imsClient.inventory.getPopulation(populationId),
    enabled,
    initialData: () =>
      queryClient
        .getQueryData<populations.PaginatedListPopulationsResult>([
          'populations',
        ])
        ?.data.find((population) => population.id === populationId),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState<populations.PaginatedListPopulationsResult>([
        'populations',
      ])?.dataUpdatedAt,
  });
}
