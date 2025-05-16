import {
  UseQueryResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { APIError, service_types } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

interface UseQueryServiceTypeProps {
  serviceTypeId: number;
  enabled?: boolean;
}

/**
 * Custom hook for querying a single service type by ID.
 * Implements cache-first pattern by checking the service types list query cache first.
 */
export default function useQueryServiceType({
  serviceTypeId,
  enabled = true,
}: UseQueryServiceTypeProps): UseQueryResult<
  service_types.ServiceType,
  APIError
> {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['serviceTypes', serviceTypeId],
    queryFn: () => imsClient.inventory.getServiceType(serviceTypeId),
    initialData: () =>
      queryClient
        .getQueryData<service_types.PaginatedServiceTypes>(['serviceTypes'])
        ?.data.find((st) => st.id === serviceTypeId),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState<service_types.PaginatedServiceTypes>([
        'serviceTypes',
      ])?.dataUpdatedAt,
    enabled,
  });
}
