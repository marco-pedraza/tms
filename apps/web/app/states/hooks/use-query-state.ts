import {
  UseQueryResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { states } from '@repo/ims-client';
import client from '@/services/ims-client';

interface QueryStateError extends Error {
  code?: string;
  status?: number;
}

interface UseQueryStateProps {
  stateId: number;
  enabled?: boolean;
}

/**
 * Custom hook for querying a single state by ID
 * Implements cache-first pattern by checking the states list query cache first
 *
 * @param props.stateId - The ID of the state to query
 * @param props.enabled - Whether the query should be enabled
 * @returns Query result containing state data
 */
export default function useQueryState({
  stateId,
  enabled = true,
}: UseQueryStateProps): UseQueryResult<states.State, QueryStateError> {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['states', stateId],
    queryFn: async () => {
      return await client.inventory.getState(stateId);
    },
    initialData: () =>
      queryClient
        .getQueryData<states.PaginatedStates>(['states'])
        ?.data.find((state) => state.id === stateId),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState<states.PaginatedStates>(['states'])
        ?.dataUpdatedAt,
    enabled,
  });
}
