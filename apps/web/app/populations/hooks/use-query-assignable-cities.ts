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
    /**
     * Edge case: The user selects a city from the assignable cities list,
     * But then, the assignable cities at the server change, removing the selected city from the list.
     * However, the selected city id is still at the form state, so the form will try to submit with an invalid city id.
     *
     * To avoid this, we are disabling all refetching. So the form will submit with an invalid city id
     * but the server will reject the request, letting the user know that the city is not assignable anymore.
     */
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}
