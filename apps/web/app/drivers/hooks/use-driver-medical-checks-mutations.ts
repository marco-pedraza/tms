import type { medical_checks } from '@repo/ims-client';
import createCollectionMutations from '@/hooks/use-collection-mutations';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for managing driver medical check mutations (create).
 *
 * This hook provides mutation functions for driver medical checks with automatic
 * query invalidation and toast notifications.
 * Note: Medical checks are immutable, so only create functionality is provided.
 */
export default function useDriverMedicalChecksMutations(driverId: number) {
  return createCollectionMutations<
    medical_checks.DriverMedicalCheck,
    medical_checks.CreateDriverMedicalCheckRepositoryPayload
  >({
    queryKey: ['drivers', driverId.toString(), 'medical-checks'],
    translationKey: 'medicalChecks',
    createMutationFn: (payload) =>
      imsClient.inventory.createDriverMedicalCheck(driverId, payload),
    // Medical checks are immutable - no delete/update functionality
    deleteMutationFn: () =>
      Promise.reject(new Error('Medical checks cannot be deleted')),
    updateMutationFn: () =>
      Promise.reject(new Error('Medical checks cannot be updated')),
    routes: {
      index: '',
      new: '',
      getDetailsRoute: () => '',
      getEditRoute: () => '',
    },
  })();
}
