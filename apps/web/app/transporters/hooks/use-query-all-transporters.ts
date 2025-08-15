import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, transporters } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

interface UseQueryAllTransportersParams {
  enabled?: boolean;
  searchTerm?: string;
  active?: boolean;
}

/**
 * Hook to fetch all transporters without pagination (useful for dropdowns)
 */
export default function useQueryAllTransporters({
  enabled = true,
  searchTerm,
  active = true,
}: UseQueryAllTransportersParams = {}): UseQueryResult<
  transporters.ListTransportersResult,
  APIError
> {
  return useQuery({
    queryKey: ['transporters', 'all', { searchTerm, active }],
    queryFn: () =>
      imsClient.inventory.listTransporters({
        searchTerm,
        filters: active !== undefined ? { active } : undefined,
      }),
    enabled,
  });
}
