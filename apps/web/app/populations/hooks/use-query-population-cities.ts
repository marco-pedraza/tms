import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, cities } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

interface UseQueryPopulationCitiesParams {
  populationId?: number;
  enabled?: boolean;
}

/**
 * Hook to fetch cities assigned to a population
 */
export default function useQueryPopulationCities({
  populationId,
  enabled = true,
}: UseQueryPopulationCitiesParams): UseQueryResult<
  cities.ListCitiesResult,
  APIError
> {
  return useQuery({
    queryKey: ['populations', populationId, 'cities'],
    queryFn: () => {
      if (!populationId) {
        throw new Error('Population ID is required');
      }
      return imsClient.inventory.getPopulationCities(populationId);
    },
    enabled: enabled && !!populationId,
  });
}
