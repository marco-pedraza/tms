import type { buses } from '@repo/ims-client';
import createCollectionMutations from '@/hooks/use-collection-mutations';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default createCollectionMutations<buses.Bus, buses.CreateBusPayload>({
  queryKey: ['buses'],
  translationKey: 'buses',
  createMutationFn: (payload) => imsClient.inventory.createBus(payload),
  deleteMutationFn: (id) => imsClient.inventory.deleteBus(id),
  updateMutationFn: (id, payload) => imsClient.inventory.updateBus(id, payload),
  routes: routes.buses,
});
