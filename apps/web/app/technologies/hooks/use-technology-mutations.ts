import type { technologies } from '@repo/ims-client';
import createCollectionMutations from '@/hooks/use-collection-mutations';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default createCollectionMutations<
  technologies.Technology,
  technologies.CreateTechnologyPayload
>({
  queryKey: ['technologies'],
  translationKey: 'technologies',
  createMutationFn: (payload) => imsClient.inventory.createTechnology(payload),
  deleteMutationFn: (id) => imsClient.inventory.deleteTechnology(id),
  updateMutationFn: (id, payload) =>
    imsClient.inventory.updateTechnology(id, payload),
  routes: routes.technologies,
});
