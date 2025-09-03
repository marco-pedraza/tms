import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, technologies } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

export default function useQueryAllTechnologies(): UseQueryResult<
  technologies.ListTechnologiesResult,
  APIError
> {
  return useQuery<technologies.ListTechnologiesResult, APIError>({
    queryKey: ['allTechnologies'],
    queryFn: () =>
      imsClient.inventory.listTechnologies({
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
