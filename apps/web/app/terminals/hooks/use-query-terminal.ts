import {
  UseQueryResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { terminals } from '@repo/ims-client';
import imsClient from '@/lib/ims-client';

interface QueryTerminalError extends Error {
  code?: string;
  status?: number;
}

interface UseQueryTerminalProps {
  terminalId: number;
  enabled?: boolean;
}

/**
 * Custom hook for querying a terminal by ID.
 *
 * This hook provides a reusable query for fetching a terminal by its ID.
 * It handles query setup, caching, and error handling.
 */
export default function useQueryTerminal({
  terminalId,
  enabled = true,
}: UseQueryTerminalProps): UseQueryResult<
  terminals.Terminal,
  QueryTerminalError
> {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['terminal', terminalId],
    enabled,
    queryFn: () => imsClient.inventory.getTerminal(terminalId),
    initialData: () =>
      queryClient
        .getQueryData<terminals.PaginatedTerminals>(['terminals'])
        ?.data.find((terminal) => terminal.id === terminalId),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState<terminals.PaginatedTerminals>(['terminals'])
        ?.dataUpdatedAt,
  });

  return query;
}
