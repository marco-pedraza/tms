import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, service_types } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a paginated list of service types.
 */
export default function useQueryServiceTypes(): UseQueryResult<
  service_types.PaginatedServiceTypes,
  APIError
> {
  return useQuery<service_types.PaginatedServiceTypes, APIError>({
    queryKey: ['serviceTypes'],
    queryFn: () => imsClient.inventory.listServiceTypesPaginated({}),
  });
}
