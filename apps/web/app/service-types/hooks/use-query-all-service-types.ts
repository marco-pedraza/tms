import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, service_types } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

/**
 * Custom hook that fetches all active service types from the inventory service.
 */
export default function useQueryAllServiceTypes(): UseQueryResult<
  service_types.ListServiceTypesResult,
  APIError
> {
  return useQuery<service_types.ListServiceTypesResult, APIError>({
    queryKey: [
      'service-types',
      'list',
      { active: true, orderBy: 'name', direction: 'asc' },
    ],
    queryFn: () =>
      imsClient.inventory.listServiceTypes({
        orderBy: [
          {
            field: 'name',
            direction: 'asc',
          },
        ],
        filters: {
          active: true,
        },
      }),
  });
}
