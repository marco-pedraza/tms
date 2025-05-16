import {
  UseQueryResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { APIError, transporters } from '@repo/ims-client';
import client from '@/services/ims-client';

interface UseQueryTransporterProps {
  transporterId: number;
  enabled?: boolean;
}

/**
 * Custom hook for querying a single transporter by ID
 * Implements cache-first pattern by checking the transporters list query cache first
 */
export default function useQueryTransporter({
  transporterId,
  enabled = true,
}: UseQueryTransporterProps): UseQueryResult<
  transporters.Transporter,
  APIError
> {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['transporters', transporterId],
    queryFn: () => client.inventory.getTransporter(transporterId),
    initialData: () =>
      queryClient
        .getQueryData<transporters.PaginatedTransporters>(['transporters'])
        ?.data.find((transporter) => transporter.id === transporterId),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState<transporters.PaginatedTransporters>([
        'transporters',
      ])?.dataUpdatedAt,
    enabled,
  });
}
