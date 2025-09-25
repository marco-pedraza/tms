import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, pathways } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

export default function useQueryAllPathways(): UseQueryResult<
  pathways.ListPathwaysResult,
  APIError
> {
  return useQuery<pathways.ListPathwaysResult, APIError>({
    queryKey: ['allPathways'],
    queryFn: () =>
      imsClient.inventory.listPathways({
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
