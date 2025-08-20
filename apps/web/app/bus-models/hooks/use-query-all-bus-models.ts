import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, bus_models } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

export default function useQueryAllBusModels(): UseQueryResult<
  bus_models.ListBusModelsResult,
  APIError
> {
  return useQuery<bus_models.ListBusModelsResult, APIError>({
    queryKey: ['allBusModels'],
    queryFn: () =>
      imsClient.inventory.listBusModels({
        orderBy: [
          {
            field: 'manufacturer',
            direction: 'asc',
          },
        ],
        filters: {
          active: true,
        },
      }),
  });
}
