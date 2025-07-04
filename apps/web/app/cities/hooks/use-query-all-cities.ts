import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, cities } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

export default function useQueryAllCities(): UseQueryResult<
  cities.ListCitiesResult,
  APIError
> {
  return useQuery<cities.ListCitiesResult, APIError>({
    queryKey: ['allCities'],
    queryFn: () =>
      imsClient.inventory.listCities({
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
