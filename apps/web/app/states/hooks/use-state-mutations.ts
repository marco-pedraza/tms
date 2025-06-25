import type { states } from '@repo/ims-client';
import createCollectionMutations from '@/hooks/use-collection-mutations';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default createCollectionMutations<
  states.State,
  states.CreateStatePayload
>({
  queryKey: ['states'],
  translationKey: 'states',
  createMutationFn: (payload) => imsClient.inventory.createState(payload),
  deleteMutationFn: (id) => imsClient.inventory.deleteState(id),
  updateMutationFn: (id, payload) =>
    imsClient.inventory.updateState(id, payload),
  routes: routes.states,
});
