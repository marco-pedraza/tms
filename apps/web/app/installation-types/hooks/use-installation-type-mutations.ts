import type { installation_types } from '@repo/ims-client';
import createCollectionMutations from '@/hooks/use-collection-mutations';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default createCollectionMutations<
  installation_types.InstallationType,
  installation_types.CreateInstallationTypePayload
>({
  queryKey: ['installationTypes'],
  translationKey: 'installationTypes',
  createMutationFn: (payload) =>
    imsClient.inventory.createInstallationType(payload),
  deleteMutationFn: (id) => imsClient.inventory.deleteInstallationType(id),
  updateMutationFn: (id, payload) =>
    imsClient.inventory.updateInstallationType(id, payload),
  routes: routes.installationTypes,
});
