import type { labels } from '@repo/ims-client';
import createCollectionMutations from '@/hooks/use-collection-mutations';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default createCollectionMutations<
  labels.Label,
  labels.CreateLabelPayload
>({
  queryKey: ['labels'],
  translationKey: 'labels',
  createMutationFn: (payload) => imsClient.inventory.createLabel(payload),
  deleteMutationFn: (id) => imsClient.inventory.deleteLabel(id),
  updateMutationFn: (id, payload) =>
    imsClient.inventory.updateLabel(id, payload),
  routes: routes.labels,
});
