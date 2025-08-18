import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, buses } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

interface UseQueryNextValidBusStatusesParams {
  busId: number;
  enabled?: boolean;
}

/*
 * Hook to fetch the next valid statuses for a bus
 */
export default function useQueryNextValidBusStatuses({
  busId,
  enabled = true,
}: UseQueryNextValidBusStatusesParams): UseQueryResult<
  buses.ListBusStatusesResult,
  APIError
> {
  return useQuery({
    queryKey: ['buses', busId, 'valid-next-statuses'],
    queryFn: () => imsClient.inventory.listBusValidNextStatuses(busId),
    enabled,
  });
}
