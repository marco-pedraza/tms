import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, labels } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

/**
 * Custom hook that fetches all active labels from the inventory service.
 */
export default function useQueryAllLabels(): UseQueryResult<
  labels.ListLabelsResult,
  APIError
> {
  return useQuery<labels.ListLabelsResult, APIError>({
    queryKey: [
      'labels',
      'list',
      { active: true, orderBy: 'name', direction: 'asc' },
    ],
    queryFn: () =>
      imsClient.inventory.listLabels({
        orderBy: [
          {
            field: 'name',
            direction: 'asc',
          },
        ],
        filters: {
          active: true,
        },
      }),
  });
}
