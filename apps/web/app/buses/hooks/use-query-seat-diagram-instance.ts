import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { APIError, seat_diagrams } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

export interface UseQuerySeatDiagramInstanceParams {
  seatDiagramId: number;
  enabled?: boolean;
}

/**
 * Custom hook for querying a specific seat diagram instance
 *
 * This hook fetches the SeatDiagram entity (the bus-specific instance),
 * which includes the `isModified` flag indicating if it has been customized
 * from its original template.
 */
export default function useQuerySeatDiagramInstance({
  seatDiagramId,
  enabled = true,
}: UseQuerySeatDiagramInstanceParams): UseQueryResult<
  seat_diagrams.SeatDiagram,
  APIError
> {
  return useQuery({
    queryKey: ['buses', 'seatDiagrams', 'instance', seatDiagramId],
    queryFn: () => imsClient.inventory.getSeatDiagram(seatDiagramId),
    enabled,
  });
}
