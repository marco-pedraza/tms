import type { amenities } from '@repo/ims-client';
import createCollectionMutations from '@/hooks/use-collection-mutations';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default createCollectionMutations<
  amenities.Amenity,
  amenities.CreateAmenityPayload
>({
  queryKey: ['amenities'],
  translationKey: 'amenities',
  routes: routes.amenities,
  createMutationFn: (payload) => imsClient.inventory.createAmenity(payload),
  updateMutationFn: (id, payload) =>
    imsClient.inventory.updateAmenity(id, payload),
  deleteMutationFn: (id) => imsClient.inventory.deleteAmenity(id),
});
