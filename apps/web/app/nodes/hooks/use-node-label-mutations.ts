import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { APIError, nodes } from '@repo/ims-client';
import { useToastMutation } from '@/hooks/use-toast-mutation';
import imsClient from '@/services/ims-client';

interface AssignLabelsToNodePayload {
  labelIds: number[];
}

export default function useNodeLabelMutations() {
  const queryClient = useQueryClient();
  const t = useTranslations('nodes');

  const assignLabelsMutation = useMutation<
    nodes.NodeWithRelations,
    APIError,
    { nodeId: number } & AssignLabelsToNodePayload
  >({
    mutationFn: ({ nodeId, ...payload }) =>
      imsClient.inventory.assignLabelsToNode(nodeId, payload),
    onSuccess: (data) => {
      // Invalidate and refetch nodes queries
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
      queryClient.invalidateQueries({ queryKey: ['node', data.id] });
    },
  });

  const assignLabels = useToastMutation({
    mutation: assignLabelsMutation,
    messages: {
      loading: t('messages.assignLabels.loading'),
      success: t('messages.assignLabels.success'),
      error: t('messages.assignLabels.error'),
    },
    onSuccess: () => {
      // Additional success logic if needed
    },
  });

  return {
    assignLabels,
  };
}
