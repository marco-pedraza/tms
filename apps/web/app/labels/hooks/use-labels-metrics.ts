import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, labels } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for querying labels metrics.
 *
 * This hook provides a reusable query for fetching labels metrics data
 * including total labels, labels in use, and most used label information.
 * It handles query setup, caching, and error handling.
 */
export default function useLabelsMetrics(): UseQueryResult<
  labels.LabelsMetrics,
  APIError
> {
  const query = useQuery<labels.LabelsMetrics, APIError>({
    queryKey: ['labels', 'metrics'],
    queryFn: () => imsClient.inventory.getLabelsMetrics(),
  });

  return query;
}
