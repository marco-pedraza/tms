import type { bus_lines } from '@repo/ims-client';
import createCollectionMutations from '@/hooks/use-collection-mutations';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default createCollectionMutations<
  bus_lines.BusLine,
  bus_lines.CreateBusLinePayload
>({
  queryKey: ['busLines'],
  translationKey: 'busLines',
  createMutationFn: (payload) => imsClient.inventory.createBusLine(payload),
  deleteMutationFn: (id) => imsClient.inventory.deleteBusLine(id),
  updateMutationFn: (id, payload) =>
    imsClient.inventory.updateBusLine(id, payload),
  routes: routes.busLines,
});
