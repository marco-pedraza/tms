import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, transporters } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a paginated list of transporters.
 *
 * This hook provides a reusable query for fetching transporters with pagination.
 * It handles query setup, caching, and error handling.
 */
export default function useQueryTransporters(): UseQueryResult<
  transporters.PaginatedTransportersWithCity,
  APIError
> {
  return useQuery<transporters.PaginatedTransportersWithCity, APIError>({
    queryKey: ['transporters'],
    queryFn: () => imsClient.inventory.listTransportersPaginated({}),
  });
}
