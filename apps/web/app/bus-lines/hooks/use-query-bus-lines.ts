import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, bus_lines } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a paginated list of bus lines.
 */
export default function useQueryBusLines(): UseQueryResult<
  bus_lines.PaginatedBusLines,
  APIError
> {
  return useQuery<bus_lines.PaginatedBusLines, APIError>({
    queryKey: ['busLines'],
    queryFn: () => imsClient.inventory.listBusLinesPaginated({}),
  });
}
