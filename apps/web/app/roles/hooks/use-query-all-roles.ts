import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, roles } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

/**
 * Custom hook that fetches all active roles from the users service.
 */
export default function useQueryAllRoles(): UseQueryResult<
  roles.ListRolesResult,
  APIError
> {
  return useQuery<roles.ListRolesResult, APIError>({
    queryKey: [
      'roles',
      'list',
      { active: true, orderBy: 'name', direction: 'asc' },
    ],
    queryFn: () =>
      imsClient.users.listRoles({
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
