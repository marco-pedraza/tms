import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, tollbooths } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

export default function useQueryAllTollbooths(): UseQueryResult<
  tollbooths.ListTollboothsResult,
  APIError
> {
  return useQuery<tollbooths.ListTollboothsResult, APIError>({
    queryKey: ['allTollbooths'],
    queryFn: () =>
      imsClient.inventory.listTollbooths({
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
