import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, states } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

export default function useQueryAllStates(): UseQueryResult<
  states.ListStatesResult,
  APIError
> {
  return useQuery<states.ListStatesResult, APIError>({
    queryKey: ['allStates'],
    queryFn: () =>
      imsClient.inventory.listStates({
        orderBy: [
          {
            field: 'name',
            direction: 'asc',
          },
        ],
        filters: {
          active: true,
        },
      }),
  });
}
