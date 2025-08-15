import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { APIError, service_types } from '@repo/ims-client';
import { useToastMutation } from '@/hooks/use-toast-mutation';
import imsClient from '@/services/ims-client';

interface AssignAmenitiesToServiceTypePayload {
  amenityIds: number[];
}

/**
 * Hook to handle mutations for service type amenities
 */
export default function useServiceTypeAmenityMutations() {
  const queryClient = useQueryClient();
  const t = useTranslations('serviceTypes');

  const assignAmenitiesMutation = useMutation<
    service_types.ServiceType,
    APIError,
    { id: number } & AssignAmenitiesToServiceTypePayload
  >({
    mutationFn: ({ id, ...payload }) =>
      imsClient.inventory.assignAmenitiesToServiceType(id, payload),
    onSuccess: (_updated, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['service-type', variables.id],
      });
    },
  });

  const assignAmenities = useToastMutation({
    mutation: assignAmenitiesMutation,
    messages: {
      loading: t('messages.assignAmenities.loading'),
      success: t('messages.assignAmenities.success'),
      error: t('messages.assignAmenities.error'),
    },
  });

  return {
    assignAmenities,
  };
}
