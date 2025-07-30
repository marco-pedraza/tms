import type { installations } from '@repo/ims-client';
import createCollectionMutations from '@/hooks/use-collection-mutations';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default createCollectionMutations<
  installations.Installation,
  installations.CreateNodeInstallationPayload
>({
  queryKey: ['installations'],
  translationKey: 'installations',
  createMutationFn: (payload) =>
    imsClient.inventory.createInstallation(payload),
  deleteMutationFn: (id) => imsClient.inventory.deleteInstallation(id),
  updateMutationFn: (id, payload) =>
    imsClient.inventory.updateInstallation(id, payload),
  routes: routes.nodes,
});
