import type { bus_diagram_models } from '@repo/ims-client';
import createCollectionMutations from '@/hooks/use-collection-mutations';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default createCollectionMutations<
  bus_diagram_models.BusDiagramModel,
  bus_diagram_models.CreateBusDiagramModelPayload
>({
  queryKey: ['seatDiagrams'],
  translationKey: 'seatDiagrams',
  createMutationFn: (payload) =>
    imsClient.inventory.createBusDiagramModel(payload),
  deleteMutationFn: (id) => imsClient.inventory.deleteBusDiagramModel(id),
  updateMutationFn: (id, payload) =>
    imsClient.inventory.updateBusDiagramModel(id, payload),
  routes: routes.seatDiagrams,
});
