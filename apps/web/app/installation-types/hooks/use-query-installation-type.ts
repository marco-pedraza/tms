import type { APIError, installation_types } from '@repo/ims-client';
import createCollectionItemQuery from '@/hooks/use-query-collection-item';
import imsClient from '@/services/ims-client';

export default createCollectionItemQuery<
  installation_types.InstallationType,
  installation_types.PaginatedListInstallationTypesResult,
  APIError
>({
  collectionQueryKey: ['installationTypes'],
  queryFn: (installationTypeId) =>
    imsClient.inventory.getInstallationType(installationTypeId),
});
