import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, service_types } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

export default function useQueryAllServiceTypes(): UseQueryResult<
  service_types.ServiceTypes,
  APIError
> {
  return useQuery<service_types.ServiceTypes, APIError>({
    queryKey: ['allServiceTypes'],
    queryFn: () =>
      imsClient.inventory.listServiceTypes({
        orderBy: [{ field: 'name', direction: 'asc' }],
      }),
  });
}
