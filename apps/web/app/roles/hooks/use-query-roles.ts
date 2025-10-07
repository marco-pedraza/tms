import type { APIError, roles } from '@repo/ims-client';
import createCollectionQuery from '@/hooks/use-query-collection';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a paginated list of roles.
 *
 * This hook provides a reusable query for fetching roles with pagination.
 * It handles query setup, caching, and error handling.
 */
export default createCollectionQuery<
  roles.Role,
  roles.PaginatedListRolesResult,
  APIError
>({
  queryKey: ['roles'],
  queryFn: (params) => imsClient.users.listRolesPaginated(params),
});
