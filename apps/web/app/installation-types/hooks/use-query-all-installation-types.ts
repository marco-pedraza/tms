import { UseQueryResult, useQuery } from '@tanstack/react-query';
import type { APIError, installation_types } from '@repo/ims-client';
import imsClient from '@/services/ims-client';

export default function useQueryAllInstallationTypes(): UseQueryResult<
  installation_types.ListInstallationTypesResult,
  APIError
> {
  return useQuery<installation_types.ListInstallationTypesResult, APIError>({
    queryKey: ['allInstallationTypes'],
    queryFn: () =>
      imsClient.inventory.listInstallationTypes({
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
