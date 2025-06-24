import type { cities } from '@repo/ims-client';
import createCollectionMutations from '@/hooks/use-collection-mutations';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default createCollectionMutations<cities.City, cities.CreateCityPayload>(
  {
    queryKey: ['cities'],
    translationKey: 'cities',
    createMutationFn: (payload) => imsClient.inventory.createCity(payload),
    deleteMutationFn: (id) => imsClient.inventory.deleteCity(id),
    updateMutationFn: (id, payload) =>
      imsClient.inventory.updateCity(id, payload),
    routes: routes.cities,
  },
);
