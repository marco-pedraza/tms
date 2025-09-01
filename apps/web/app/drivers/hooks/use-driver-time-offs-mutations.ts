import type { time_offs } from '@repo/ims-client';
import createCollectionMutations from '@/hooks/use-collection-mutations';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for managing driver time-off mutations (create, update, delete).
 *
 * This hook provides mutation functions for driver time-offs with automatic
 * query invalidation and toast notifications.
 */
export default function useDriverTimeOffsMutations(driverId: number) {
  return createCollectionMutations<
    time_offs.DriverTimeOff,
    time_offs.CreateDriverTimeOffRepositoryPayload
  >({
    queryKey: ['drivers', driverId.toString(), 'timeOffs'],
    translationKey: 'timeOffs',
    createMutationFn: (payload) =>
      imsClient.inventory.createDriverTimeOff(driverId, payload),
    deleteMutationFn: (id) =>
      imsClient.inventory.deleteDriverTimeOff(driverId, id),
    updateMutationFn: (id, payload) =>
      imsClient.inventory.updateDriverTimeOff(driverId, id, payload),
    routes: {
      index: '',
      new: '',
      getDetailsRoute: () => '',
      getEditRoute: () => '',
    },
  })();
}
