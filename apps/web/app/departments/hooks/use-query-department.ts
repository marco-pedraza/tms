import type { APIError, departments, shared } from '@repo/ims-client';
import createCollectionItemQuery from '@/hooks/use-query-collection-item';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a department by its ID.
 *
 * This hook provides a reusable query for fetching a department by its ID.
 * It handles query setup, caching, and error handling.
 */
export default createCollectionItemQuery<
  departments.Department,
  { data: departments.Department[]; pagination: shared.PaginationMeta },
  APIError
>({
  collectionQueryKey: ['departments'],
  queryFn: (departmentId) => imsClient.users.getDepartment(departmentId),
});
