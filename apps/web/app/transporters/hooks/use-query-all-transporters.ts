import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, transporters } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying all transporters.
 *
 * This hook provides a reusable query for fetching transporters with pagination.
 * It handles query setup, caching, and error handling.
 */
export default function useQueryAllTransporters(): UseQueryResult<
  transporters.Transporters,
  APIError
> {
  return useQuery<transporters.Transporters, APIError>({
    queryKey: ['allTransporters'],
    queryFn: () => imsClient.inventory.listTransporters({}),
  });
}
