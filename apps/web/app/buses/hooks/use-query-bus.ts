import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, buses } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

interface UseQueryBusParams {
  busId: number;
  enabled?: boolean;
}

/**
 * Hook to fetch a single bus by ID
 */
export default function useQueryBus({
  busId,
  enabled = true,
}: UseQueryBusParams): UseQueryResult<buses.ExtendedBusData, APIError> {
  return useQuery({
    queryKey: ['buses', busId],
    queryFn: () => imsClient.inventory.getBus(busId),
    enabled,
  });
}
