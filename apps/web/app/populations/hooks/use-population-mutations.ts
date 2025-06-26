import type { populations } from '@repo/ims-client';
import createCollectionMutations from '@/hooks/use-collection-mutations';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default createCollectionMutations<
  populations.Population,
  populations.CreatePopulationPayload
>({
  queryKey: ['populations'],
  translationKey: 'populations',
  createMutationFn: (payload) => imsClient.inventory.createPopulation(payload),
  deleteMutationFn: (id) => imsClient.inventory.deletePopulation(id),
  updateMutationFn: (id, payload) =>
    imsClient.inventory.updatePopulation(id, payload),
  routes: routes.populations,
});
