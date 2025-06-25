import type { countries } from '@repo/ims-client';
import createCollectionMutations from '@/hooks/use-collection-mutations';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default createCollectionMutations<
  countries.Country,
  countries.CreateCountryPayload
>({
  queryKey: ['countries'],
  translationKey: 'countries',
  createMutationFn: (payload) => imsClient.inventory.createCountry(payload),
  deleteMutationFn: (id) => imsClient.inventory.deleteCountry(id),
  updateMutationFn: (id, payload) =>
    imsClient.inventory.updateCountry(id, payload),
  routes: routes.countries,
});
