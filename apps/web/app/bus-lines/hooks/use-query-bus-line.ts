import {
  UseQueryResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { APIError, bus_lines } from '@repo/ims-client';
import client from '@/services/ims-client';

interface UseQueryBusLineProps {
  busLineId: number;
  enabled?: boolean;
}

/**
 * Custom hook for querying a single bus line by ID
 * Implements cache-first pattern by checking the bus lines list query cache first
 */
export default function useQueryBusLine({
  busLineId,
  enabled = true,
}: UseQueryBusLineProps): UseQueryResult<bus_lines.BusLine, APIError> {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['busLines', busLineId],
    queryFn: () => client.inventory.getBusLine(busLineId),
    initialData: () =>
      queryClient
        .getQueryData<bus_lines.PaginatedListBusLinesResult>(['busLines'])
        ?.data.find((busLine) => busLine.id === busLineId),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState<bus_lines.PaginatedListBusLinesResult>([
        'busLines',
      ])?.dataUpdatedAt,
    enabled,
  });
}
