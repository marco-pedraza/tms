import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, permission_groups } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

/**
 * Custom hook that fetches all permission groups from the inventory service.
 */
export default function useQueryPermissionGroups(): UseQueryResult<
  permission_groups.PermissionGroups,
  APIError
> {
  return useQuery<permission_groups.PermissionGroups, APIError>({
    queryKey: ['permission-groups'],
    queryFn: () => imsClient.users.listPermissionGroups(),
  });
}
