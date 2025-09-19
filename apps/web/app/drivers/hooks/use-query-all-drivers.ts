import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, drivers } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

/**
 * Custom hook that fetches all active drivers from the inventory service.
 */
export default function useQueryAllDrivers(
  params: drivers.ListDriversQueryParams,
): UseQueryResult<drivers.ListDriversResult, APIError> {
  return useQuery<drivers.ListDriversResult, APIError>({
    queryKey: [
      'drivers',
      'list',
      { active: true, orderBy: 'driverKey', direction: 'asc', ...params },
    ],
    queryFn: () =>
      imsClient.inventory.listDrivers({
        orderBy: [
          {
            field: 'driverKey',
            direction: 'asc',
          },
        ],
        ...params,
      }),
  });
}
