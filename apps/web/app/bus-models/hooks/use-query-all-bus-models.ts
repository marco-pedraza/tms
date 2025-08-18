import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, bus_models } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

export default function useQueryAllBusModels(): UseQueryResult<
  bus_models.BusModels,
  APIError
> {
  return useQuery<bus_models.BusModels, APIError>({
    queryKey: ['allBusModels'],
    queryFn: () => imsClient.inventory.listBusModels(),
  });
}
