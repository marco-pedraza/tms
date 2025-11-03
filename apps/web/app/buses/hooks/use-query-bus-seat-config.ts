import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { APIError, bus_seats } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

export interface UseQueryBusSeatConfigurationParams {
  seatDiagramId: number;
  enabled?: boolean;
}

/**
 * Custom hook for querying seat configuration for a specific bus seat diagram.
 *
 * This hook queries the actual bus seats (not seat models) for a specific
 * seat diagram instance. Used for bus-specific diagram customization.
 */
export default function useQueryBusSeatConfiguration({
  seatDiagramId,
  enabled = true,
}: UseQueryBusSeatConfigurationParams): UseQueryResult<
  bus_seats.ListSeatDiagramSeatsResult,
  APIError
> {
  return useQuery({
    queryKey: ['buses', 'seatDiagrams', seatDiagramId, 'seats'],
    queryFn: () => imsClient.inventory.listSeatDiagramSeats(seatDiagramId),
    enabled,
  });
}
