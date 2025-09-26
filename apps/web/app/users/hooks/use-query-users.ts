import type { APIError, users } from '@repo/ims-client';
import createCollectionQuery from '@/hooks/use-query-collection';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a paginated list of users.
 *
 * This hook provides a reusable query for fetching users with pagination.
 * It handles query setup, caching, and error handling.
 */
export default createCollectionQuery<
  users.SafeUser,
  users.PaginatedListUsersResult,
  APIError
>({
  queryKey: ['users'],
  queryFn: (params) => imsClient.users.listUsersPaginated(params),
});
