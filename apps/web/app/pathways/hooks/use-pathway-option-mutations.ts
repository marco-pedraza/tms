import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { APIError, pathways } from '@repo/ims-client';
import { useToastMutation } from '@/hooks/use-toast-mutation';
import imsClient from '@/services/ims-client';

interface SyncPathwayOptionsPayload {
  options: pathways.BulkSyncOptionInput[];
}

export default function usePathwayOptionMutations() {
  const queryClient = useQueryClient();
  const t = useTranslations('pathways');

  const syncPathwayOptionsMutation = useMutation<
    pathways.Pathway,
    APIError,
    { pathwayId: number } & SyncPathwayOptionsPayload
  >({
    mutationFn: ({ pathwayId, ...payload }) =>
      imsClient.inventory.syncPathwayOptions(pathwayId, payload),
    onSuccess: (data) => {
      // Invalidate and refetch pathway queries
      queryClient.invalidateQueries({ queryKey: ['pathways'] });
      queryClient.invalidateQueries({ queryKey: ['allPathways'] });
      queryClient.invalidateQueries({
        queryKey: ['allPathwaysOptions', data.id],
      });
    },
  });

  const syncPathwayOptions = useToastMutation({
    mutation: syncPathwayOptionsMutation,
    messages: {
      loading: t('messages.syncPathwayOptions.loading'),
      success: t('messages.syncPathwayOptions.success'),
      error: t('messages.syncPathwayOptions.error'),
    },
    onSuccess: () => {
      // Additional success logic if needed
    },
  });

  return {
    syncPathwayOptions,
  };
}
