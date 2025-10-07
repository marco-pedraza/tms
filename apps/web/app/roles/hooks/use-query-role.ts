import type { APIError, roles } from '@repo/ims-client';
import createCollectionItemQuery from '@/hooks/use-query-collection-item';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a role by its ID.
 *
 * This hook provides a reusable query for fetching a role by its ID.
 * It handles query setup, caching, and error handling.
 */
export default createCollectionItemQuery<
  roles.RoleWithPermissions,
  { data: roles.RoleWithPermissions[] },
  APIError
>({
  collectionQueryKey: ['roles'],
  queryFn: (roleId) => imsClient.users.getRole(roleId),
});
