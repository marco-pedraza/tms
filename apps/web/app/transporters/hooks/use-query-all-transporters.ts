import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, transporters } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

export default function useQueryAllTransporters(): UseQueryResult<
  transporters.Transporters,
  APIError
> {
  return useQuery<transporters.Transporters, APIError>({
    queryKey: ['allTransporters'],
    queryFn: () => imsClient.inventory.listTransporters({}),
  });
}
