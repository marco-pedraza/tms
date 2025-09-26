import type { APIError, shared, users } from '@repo/ims-client';
import createCollectionItemQuery from '@/hooks/use-query-collection-item';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a user by its ID.
 *
 * This hook provides a reusable query for fetching a user by its ID.
 * It handles query setup, caching, and error handling.
 */
export default createCollectionItemQuery<
  users.UserWithDepartment,
  { data: users.UserWithDepartment[]; pagination: shared.PaginationMeta },
  APIError
>({
  collectionQueryKey: ['users'],
  queryFn: (userId) => imsClient.users.getUser(userId),
});
