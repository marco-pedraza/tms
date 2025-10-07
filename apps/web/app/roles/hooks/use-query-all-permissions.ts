import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, permissions } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

/**
 * Custom hook that fetches all permissions from the inventory service.
 */
export default function useQueryAllPermissions(): UseQueryResult<
  permissions.Permissions,
  APIError
> {
  return useQuery<permissions.Permissions, APIError>({
    queryKey: ['permissions', 'list', { orderBy: 'name', direction: 'asc' }],
    queryFn: () =>
      imsClient.users.listPermissions({
        orderBy: [
          {
            field: 'name',
            direction: 'asc',
          },
        ],
      }),
  });
}
