import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, chromatics } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

export default function useQueryAllChromatics(): UseQueryResult<
  chromatics.ListChromaticsResult,
  APIError
> {
  return useQuery<chromatics.ListChromaticsResult, APIError>({
    queryKey: ['allChromatics'],
    queryFn: () =>
      imsClient.inventory.listChromatics({
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
