import type { APIError, departments } from '@repo/ims-client';
import createCollectionQuery from '@/hooks/use-query-collection';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying a paginated list of departments.
 *
 * This hook provides a reusable query for fetching departments with pagination.
 * It handles query setup, caching, and error handling.
 */
export default createCollectionQuery<
  departments.Department,
  departments.PaginatedDepartments,
  APIError
>({
  queryKey: ['departments'],
  queryFn: (params) =>
    imsClient.users.listDepartmentsPaginated({
      ...params,
      orderBy: params.orderBy?.length
        ? params.orderBy
        : [{ field: 'id', direction: 'asc' }],
    } as departments.PaginationParamsDepartments),
});
