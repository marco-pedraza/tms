import type { drivers } from '@repo/ims-client';
import createCollectionMutations from '@/hooks/use-collection-mutations';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default createCollectionMutations<
  drivers.Driver,
  drivers.CreateDriverPayload
>({
  queryKey: ['drivers'],
  translationKey: 'drivers',
  createMutationFn: (payload) => imsClient.inventory.createDriver(payload),
  deleteMutationFn: (id) => imsClient.inventory.deleteDriver(id),
  updateMutationFn: (id, payload) =>
    imsClient.inventory.updateDriver(id, payload),
  routes: routes.drivers,
});
