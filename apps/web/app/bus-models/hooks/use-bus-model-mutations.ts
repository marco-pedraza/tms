import type { bus_models } from '@repo/ims-client';
import createCollectionMutations from '@/hooks/use-collection-mutations';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default createCollectionMutations<
  bus_models.BusModel,
  bus_models.CreateBusModelPayload
>({
  queryKey: ['busModels'],
  translationKey: 'busModels',
  createMutationFn: (payload) => imsClient.inventory.createBusModel(payload),
  deleteMutationFn: (id) => imsClient.inventory.deleteBusModel(id),
  updateMutationFn: (id, payload) =>
    imsClient.inventory.updateBusModel(id, payload),
  routes: routes.busModels,
});
