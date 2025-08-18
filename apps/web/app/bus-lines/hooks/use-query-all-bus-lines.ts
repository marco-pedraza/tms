import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, bus_lines } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

export default function useQueryAllBusLines(): UseQueryResult<
  bus_lines.ListBusLinesResult,
  APIError
> {
  return useQuery<bus_lines.ListBusLinesResult, APIError>({
    queryKey: ['allBusLines'],
    queryFn: () =>
      imsClient.inventory.listBusLines({
        orderBy: [
          {
            field: 'name',
            direction: 'asc',
          },
        ],
      }),
  });
}
