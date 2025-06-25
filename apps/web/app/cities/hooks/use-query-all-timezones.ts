import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, timezones } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

export default function useQueryAllTimezones(): UseQueryResult<
  timezones.Timezones,
  APIError
> {
  return useQuery<timezones.Timezones, APIError>({
    queryKey: ['allTimezones'],
    queryFn: () => imsClient.inventory.listTimezones(),
  });
}
