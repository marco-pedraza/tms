import type { transporters } from '@repo/ims-client';
import createCollectionMutations from '@/hooks/use-collection-mutations';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default createCollectionMutations<
  transporters.Transporter,
  transporters.CreateTransporterPayload
>({
  queryKey: ['transporters'],
  translationKey: 'transporters',
  createMutationFn: (payload) => imsClient.inventory.createTransporter(payload),
  deleteMutationFn: (id) => imsClient.inventory.deleteTransporter(id),
  updateMutationFn: (id, payload) =>
    imsClient.inventory.updateTransporter(id, payload),
  routes: routes.transporters,
});
