import {
  type UseQueryResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { APIError, nodes } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

interface UseQueryNodeParams {
  nodeId: number;
  enabled?: boolean;
}

/**
 * Hook to fetch a single population by ID
 */
export default function useQueryNode({
  nodeId,
  enabled = true,
}: UseQueryNodeParams): UseQueryResult<nodes.NodeWithRelations, APIError> {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['nodes', nodeId],
    queryFn: () => imsClient.inventory.getNode(nodeId),
    enabled,
    initialData: () =>
      queryClient
        .getQueryData<nodes.PaginatedListNodesResult>(['nodes'])
        ?.data.find((node) => node.id === nodeId),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState<nodes.PaginatedListNodesResult>(['nodes'])
        ?.dataUpdatedAt,
  });
}
