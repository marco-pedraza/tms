import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { terminals } from '@repo/ims-client';
import { useToastMutation } from '@/hooks/use-toast-mutation';
import imsClient from '@/lib/ims-client';
import type { TerminalFormValues } from '@/terminals/terminal-form';

interface MutationMessages {
  loading: string;
  success: string;
  error: string;
}

/**
 * Custom hook for terminal-related CRUD operations with toast notifications.
 *
 * This hook provides a set of enhanced mutations for creating, updating, and deleting
 * terminals. Each mutation includes toast notifications, automatic query invalidation,
 * and navigation to appropriate routes after successful operations.
 *
 * @returns Object containing enhanced mutations for terminal operations
 * @returns {Object} result.createTerminal - Mutation for creating a new terminal
 * @returns {Object} result.updateTerminal - Mutation for updating an existing terminal
 * @returns {Object} result.deleteTerminal - Mutation for deleting a terminal
 */
export function useTerminalMutations() {
  const t = useTranslations('terminals');
  const router = useRouter();
  const queryClient = useQueryClient();

  /**
   * Invalidates terminals-related queries to refresh data
   */
  const invalidateTerminals = () => {
    queryClient.invalidateQueries({ queryKey: ['terminals'] });
  };

  // Prepare messages for the mutations
  const createMessages: MutationMessages = {
    loading: t('messages.create.loading'),
    success: t('messages.create.success'),
    error: t('messages.create.error'),
  };

  const updateMessages: MutationMessages = {
    loading: t('messages.update.loading'),
    success: t('messages.update.success'),
    error: t('messages.update.error'),
  };

  const deleteMessages: MutationMessages = {
    loading: t('messages.delete.loading'),
    success: t('messages.delete.success'),
    error: t('messages.delete.error'),
  };

  // Create Terminal
  /**
   * Base mutation for creating a new terminal
   */
  const createTerminalMutation = useMutation({
    mutationFn: (values: TerminalFormValues) => {
      // Convert form values to the correct API format
      const parsedValues = {
        ...values,
        latitude: parseFloat(values.latitude.toString()),
        longitude: parseFloat(values.longitude.toString()),
      };
      return imsClient.inventory.createTerminal(parsedValues);
    },
  });

  /**
   * Enhanced mutation for creating a terminal with toast notifications,
   * query invalidation, and navigation
   */
  const createTerminal = useToastMutation({
    mutation: createTerminalMutation,
    messages: createMessages,
    onSuccess: (data: terminals.Terminal) => {
      invalidateTerminals();
      router.push(`/terminals/${data.id}`);
    },
  });

  // Update Terminal
  /**
   * Base mutation for updating an existing terminal
   */
  const updateTerminalMutation = useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: number;
      values: TerminalFormValues;
    }) => {
      if (!id) {
        throw new Error('Terminal ID is required for updating');
      }
      // Convert form values to the correct API format
      const parsedValues = {
        ...values,
        latitude: parseFloat(values.latitude.toString()),
        longitude: parseFloat(values.longitude.toString()),
      };
      return imsClient.inventory.updateTerminal(id, parsedValues);
    },
  });

  /**
   * Enhanced mutation for updating a terminal with toast notifications,
   * query invalidation, and navigation
   */
  const updateTerminal = useToastMutation({
    mutation: updateTerminalMutation,
    messages: updateMessages,
    onSuccess: (data: terminals.Terminal) => {
      invalidateTerminals();
      router.push(`/terminals/${data.id}`);
    },
  });

  // Delete Terminal
  /**
   * Base mutation for deleting a terminal
   */
  const deleteTerminalMutation = useMutation({
    mutationFn: (id: number) => {
      if (!id) {
        throw new Error('Terminal ID is required for deletion');
      }
      return imsClient.inventory.deleteTerminal(id);
    },
  });

  /**
   * Enhanced mutation for deleting a terminal with toast notifications,
   * query invalidation, and navigation
   */
  const deleteTerminal = useToastMutation({
    mutation: deleteTerminalMutation,
    messages: deleteMessages,
    onSuccess: () => {
      invalidateTerminals();
      router.push('/terminals');
    },
  });

  return {
    createTerminal,
    updateTerminal,
    deleteTerminal,
  };
}
