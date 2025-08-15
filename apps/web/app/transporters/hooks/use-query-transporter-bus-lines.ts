import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, bus_lines } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

interface UseQueryTransporterBusLinesParams {
  transporterId: number;
  enabled?: boolean;
  searchTerm?: string;
  active?: boolean;
}

/**
 * Hook to fetch all bus lines for a specific transporter without pagination
 */
export default function useQueryTransporterBusLines({
  transporterId,
  enabled = true,
  searchTerm,
  active,
}: UseQueryTransporterBusLinesParams): UseQueryResult<
  bus_lines.ListBusLinesResult,
  APIError
> {
  return useQuery({
    queryKey: [
      'busLines',
      'transporter',
      transporterId,
      { searchTerm, active },
    ],
    queryFn: () =>
      imsClient.inventory.listBusLines({
        searchTerm,
        filters: {
          transporterId,
          ...(active !== undefined ? { active } : {}),
        },
      }),
    enabled: enabled && !!transporterId,
  });
}
