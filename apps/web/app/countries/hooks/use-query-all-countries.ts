import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, countries } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

export default function useQueryAllCountries(): UseQueryResult<
  countries.ListCountriesResult,
  APIError
> {
  return useQuery<countries.ListCountriesResult, APIError>({
    queryKey: ['allCountries'],
    queryFn: () =>
      imsClient.inventory.listCountries({
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
