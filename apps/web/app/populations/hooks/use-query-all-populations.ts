import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, populations } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

export default function useQueryAllPopulations(): UseQueryResult<
  populations.ListPopulationsResult,
  APIError
> {
  return useQuery<populations.ListPopulationsResult, APIError>({
    queryKey: ['allPopulations'],
    queryFn: () =>
      imsClient.inventory.listPopulations({
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
