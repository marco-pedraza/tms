import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useToastMutation } from '@/hooks/use-toast-mutation';
import imsClient from '@/services/ims-client';

/**
 * Custom hook for bus model amenity assignment mutations
 */
export default function useBusModelAmenityMutations() {
  const t = useTranslations('busModels');
  const queryClient = useQueryClient();

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['busModels'] });
  };

  const assignAmenitiesMutation = useMutation({
    mutationFn: async ({
      busModelId,
      amenityIds,
    }: {
      busModelId: number;
      amenityIds: number[];
    }) => {
      return await imsClient.inventory.assignAmenitiesToBusModel(busModelId, {
        amenityIds,
      });
    },
  });

  const assignAmenitiesMessages = {
    loading: t('messages.assignAmenities.loading'),
    success: t('messages.assignAmenities.success'),
    error: t('messages.assignAmenities.error'),
  };

  const assignAmenities = useToastMutation({
    mutation: assignAmenitiesMutation,
    messages: assignAmenitiesMessages,
    onSuccess: () => {
      invalidateQueries();
    },
  });

  return {
    assignAmenities,
  };
}
