import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, populations } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

interface UseQueryPopulationByAssignedCityParams {
  cityId: number;
  enabled?: boolean;
}

export default function useQueryPopulationByAssignedCity({
  cityId,
  enabled = true,
}: UseQueryPopulationByAssignedCityParams): UseQueryResult<
  populations.FindPopulationByAssignedCityResult,
  APIError
> {
  return useQuery({
    queryKey: ['populations', 'assigned', cityId],
    queryFn: () => imsClient.inventory.findPopulationByAssignedCity(cityId),
    enabled,
  });
}
