import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { APIError, installations } from '@repo/ims-client';
import { useToastMutation } from '@/hooks/use-toast-mutation';
import imsClient from '@/services/ims-client';

interface AssignAmenitiesToInstallationPayload {
  amenityIds: number[];
}

export default function useInstallationAmenityMutations() {
  const queryClient = useQueryClient();
  const t = useTranslations('nodes');

  const assignAmenitiesMutation = useMutation<
    installations.InstallationWithDetails,
    APIError,
    { installationId: number } & AssignAmenitiesToInstallationPayload
  >({
    mutationFn: ({ installationId, ...payload }) =>
      imsClient.inventory.assignAmenitiesToInstallation(
        installationId,
        payload,
      ),
    onSuccess: () => {
      // Also invalidate nodes queries since nodes show installation data
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
      queryClient.invalidateQueries({
        queryKey: ['node'],
        predicate: () => true,
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
    onSuccess: () => {
      // Additional success logic if needed
    },
  });

  return {
    assignAmenities,
  };
}
