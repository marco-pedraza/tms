import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { states } from '@repo/ims-client';
import client from '@/lib/ims-client';

type State = states.State;

/**
 * Custom hook for querying a single state by ID
 * Implements cache-first pattern by checking the states list query cache first
 *
 * @param props.stateId - The ID of the state to query
 * @param props.enabled - Whether the query should be enabled
 * @returns Query result containing state data
 */
export function useQueryState({
  stateId,
  enabled = true,
}: {
  stateId: string | number;
  enabled?: boolean;
}) {
  const queryClient = useQueryClient();
  const numericId =
    typeof stateId === 'string' ? parseInt(stateId, 10) : stateId;

  return useQuery({
    queryKey: ['states', numericId],
    queryFn: async () => {
      return await client.inventory.getState(numericId);
    },
    initialData: () =>
      queryClient
        .getQueryData<states.PaginatedStates>(['states'])
        ?.data.find((state) => state.id === numericId),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState<states.PaginatedStates>(['states'])
        ?.dataUpdatedAt,
    enabled,
  });
}
