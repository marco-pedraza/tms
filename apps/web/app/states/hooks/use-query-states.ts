import { useQuery } from '@tanstack/react-query';
import type { states } from '@repo/ims-client';
import client from '@/lib/ims-client';

/**
 * Custom hook for querying states with pagination
 *
 * @returns Query result containing states data
 */
export function useQueryStates() {
  return useQuery({
    queryKey: ['states'],
    queryFn: async () => await client.inventory.listStatesPaginated({}),
  });
}

/**
 * Custom hook for querying a single state by ID
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
  return useQuery({
    queryKey: ['states', stateId],
    queryFn: async () => {
      const id = typeof stateId === 'string' ? parseInt(stateId, 10) : stateId;
      return await client.inventory.getState(id);
    },
    enabled,
  });
}
