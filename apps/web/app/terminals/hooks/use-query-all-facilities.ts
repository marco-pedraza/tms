import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, facilities } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

export default function useQueryAllFacilities(): UseQueryResult<
  facilities.Facilities,
  APIError
> {
  return useQuery<facilities.Facilities, APIError>({
    queryKey: ['allFacilities'],
    queryFn: () => imsClient.inventory.listFacilities(),
  });
}
