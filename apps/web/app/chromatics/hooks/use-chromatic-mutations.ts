import type { chromatics } from '@repo/ims-client';
import createCollectionMutations from '@/hooks/use-collection-mutations';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default createCollectionMutations<
  chromatics.Chromatic,
  chromatics.CreateChromaticPayload
>({
  queryKey: ['chromatics'],
  translationKey: 'chromatics',
  createMutationFn: (payload) => imsClient.inventory.createChromatic(payload),
  deleteMutationFn: (id) => imsClient.inventory.deleteChromatic(id),
  updateMutationFn: (id, payload) =>
    imsClient.inventory.updateChromatic(id, payload),
  routes: routes.chromatics,
});
