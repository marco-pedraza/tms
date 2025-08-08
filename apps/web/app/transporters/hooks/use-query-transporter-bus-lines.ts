import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { APIError, bus_lines } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

interface UseQueryTransporterBusLinesProps {
  transporterId: number;
  enabled?: boolean;
}

export default function useQueryTransporterBusLines({
  transporterId,
  enabled = true,
}: UseQueryTransporterBusLinesProps): UseQueryResult<
  bus_lines.BusLine[],
  APIError
> {
  return useQuery({
    enabled,
    queryKey: ['transporters', transporterId, 'bus-lines'],
    queryFn: async () => {
      const response = await imsClient.inventory.listBusLines({
        filters: {
          transporterId,
        },
      });
      return response.data;
    },
  });
}
