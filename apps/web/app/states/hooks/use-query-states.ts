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
