import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { terminals } from '@repo/ims-client';
import client from '@/lib/ims-client';

type QueryTerminalsError = Error;

/**
 * Custom hook for querying a paginated list of terminals.
 *
 * This hook provides a reusable query for fetching terminals with pagination.
 * It handles query setup, caching, and error handling.
 */
export default function useQueryTerminals(): UseQueryResult<
  terminals.PaginatedTerminals,
  QueryTerminalsError
> {
  return useQuery({
    queryKey: ['terminals'],
    queryFn: () => client.inventory.listTerminals({}),
  });
}
