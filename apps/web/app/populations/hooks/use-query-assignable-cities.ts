import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, populations } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

interface UseQueryAssignableCitiesParams {
  populationId?: number;
}

export default function useQueryAssignableCities({
  populationId,
}: UseQueryAssignableCitiesParams): UseQueryResult<
  populations.ListAvailableCitiesResult,
  APIError
> {
  return useQuery<populations.ListAvailableCitiesResult, APIError>({
    queryKey: ['assignableCities', populationId],
    queryFn: () =>
      imsClient.inventory.listAvailableCities({
        populationId,
      }),
  });
}
