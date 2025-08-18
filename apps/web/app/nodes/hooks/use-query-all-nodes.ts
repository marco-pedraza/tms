import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, nodes } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

export default function useQueryAllNodes(): UseQueryResult<
  nodes.ListNodesResult,
  APIError
> {
  return useQuery<nodes.ListNodesResult, APIError>({
    queryKey: ['allNodes'],
    queryFn: () =>
      imsClient.inventory.listNodes({
        orderBy: [
          {
            field: 'name',
            direction: 'asc',
          },
        ],
      }),
  });
}
