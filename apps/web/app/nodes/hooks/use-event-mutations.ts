import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { nodes } from '@repo/ims-client';
import { useToastMutation } from '@/hooks/use-toast-mutation';
import imsClient from '@/services/ims-client';

export default function useEventMutations() {
  const t = useTranslations('nodeEvents');

  const assignEventsMutation = useMutation({
    mutationFn: ({
      id,
      nodeEvents,
    }: {
      id: number;
      nodeEvents: nodes.NodeEventAssignmentPayload[];
    }) => {
      if (!nodeEvents) {
        throw new Error('Node events are required');
      }
      return imsClient.inventory.assignEventsToNode(id, {
        events: nodeEvents,
      });
    },
  });

  const createWithToast = useToastMutation({
    mutation: assignEventsMutation,
    messages: {
      loading: t('messages.create.loading'),
      success: t('messages.create.success'),
      error: t('messages.create.error'),
    },
  });

  const updateWithToast = useToastMutation({
    mutation: assignEventsMutation,
    messages: {
      loading: t('messages.update.loading'),
      success: t('messages.update.success'),
      error: t('messages.update.error'),
    },
  });

  return {
    create: createWithToast,
    update: updateWithToast,
  };
}
