import type { pathways } from '@repo/ims-client';
import createCollectionMutations from '@/hooks/use-collection-mutations';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default createCollectionMutations<
  pathways.Pathway,
  pathways.CreatePathwayPayload
>({
  queryKey: ['pathways'],
  translationKey: 'pathways',
  createMutationFn: (payload) => imsClient.inventory.createPathway(payload),
  deleteMutationFn: (id) => imsClient.inventory.deletePathway(id),
  updateMutationFn: (id, payload) =>
    imsClient.inventory.updatePathway(id, payload),
  routes: routes.pathways,
});
