import { useQuery } from '@tanstack/react-query';
import imsClient from '@/services/ims-client';

export interface UseQueryDriverTimeOffsParams {
  driverId: number;
  enabled?: boolean;
}

/**
 * Custom hook for querying all time-offs for a specific driver.
 *
 * This hook provides a reusable query for fetching driver time-offs.
 * It handles query setup and error handling.
 */
export default function useQueryDriverTimeOffs({
  driverId,
  enabled = true,
}: UseQueryDriverTimeOffsParams) {
  return useQuery({
    queryKey: ['drivers', driverId, 'time-offs'],
    queryFn: () =>
      imsClient.inventory.listDriverTimeOffs(driverId, {
        orderBy: [{ field: 'id', direction: 'desc' }],
      }),
    enabled: enabled && !!driverId,
  });
}
