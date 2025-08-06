import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, event_types } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

/**
 * Custom hook that fetches all active events from the inventory service.
 * This hook is designed for use in form selectors where all available events are needed.
 */
export default function useQueryAllEvents(): UseQueryResult<
  event_types.ListEventTypesResult,
  APIError
> {
  return useQuery<event_types.ListEventTypesResult, APIError>({
    queryKey: [
      'events',
      {
        active: true,
        orderBy: 'name',
        direction: 'asc',
      },
    ],
    queryFn: () =>
      imsClient.inventory.listEventTypes({
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
