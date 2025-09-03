import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { APIError, bus_seat_models } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

export interface UseQuerySeatConfigurationParams {
  seatDiagramId: number;
  enabled?: boolean;
}

/**
 * Custom hook for querying seat configuration for a seat diagram.
 *
 * This hook is useful for dropdowns and other components that need
 * a complete list of seat diagrams.
 */
export default function useQuerySeatConfiguration({
  seatDiagramId,
  enabled = true,
}: UseQuerySeatConfigurationParams): UseQueryResult<
  bus_seat_models.ListBusSeatModelsResult,
  APIError
> {
  return useQuery({
    queryKey: ['seatDiagrams', seatDiagramId, 'seatConfiguration'],
    queryFn: () => imsClient.inventory.listBusDiagramModelSeats(seatDiagramId),
    enabled,
  });
}
