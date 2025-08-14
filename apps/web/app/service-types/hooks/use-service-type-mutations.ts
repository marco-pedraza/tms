import type { service_types } from '@repo/ims-client';
import createCollectionMutations from '@/hooks/use-collection-mutations';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default createCollectionMutations<
  service_types.ServiceType,
  service_types.CreateServiceTypePayload
>({
  queryKey: ['service-types'],
  translationKey: 'serviceTypes',
  createMutationFn: (payload) => imsClient.inventory.createServiceType(payload),
  deleteMutationFn: (id) => imsClient.inventory.deleteServiceType(id),
  updateMutationFn: (id, payload) =>
    imsClient.inventory.updateServiceType(id, payload),
  routes: routes.serviceTypes,
});
