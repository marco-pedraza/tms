import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { states } from '@repo/ims-client';
import { useToastMutation } from '@/hooks/use-toast-mutation';
import imsClient from '@/lib/ims-client';
import type { StateFormValues } from '../state-form';

interface MutationMessages {
  loading: string;
  success: string;
  error: string;
}

/**
 * Custom hook for state-related CRUD operations with toast notifications.
 *
 * This hook provides a set of enhanced mutations for creating, updating, and deleting
 * states. Each mutation includes toast notifications, automatic query invalidation,
 * and navigation to appropriate routes after successful operations.
 *
 * @returns Object containing enhanced mutations for state operations
 * @returns {Object} result.createState - Mutation for creating a new state
 * @returns {Object} result.updateState - Mutation for updating an existing state
 * @returns {Object} result.deleteState - Mutation for deleting a state
 */
export function useStateMutations() {
  const t = useTranslations('states');
  const router = useRouter();
  const queryClient = useQueryClient();

  /**
   * Invalidates states-related queries to refresh data
   */
  const invalidateStates = () => {
    queryClient.invalidateQueries({ queryKey: ['states'] });
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

  // Create State
  /**
   * Base mutation for creating a new state
   */
  const createStateMutation = useMutation({
    mutationFn: (values: StateFormValues) =>
      imsClient.inventory.createState(values),
  });

  /**
   * Enhanced mutation for creating a state with toast notifications,
   * query invalidation, and navigation
   */
  const createState = useToastMutation({
    mutation: createStateMutation,
    messages: createMessages,
    onSuccess: (data: states.State) => {
      invalidateStates();
      router.push(`/states/${data.id}`);
    },
  });

  // Update State
  /**
   * Base mutation for updating an existing state
   */
  const updateStateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: StateFormValues }) => {
      if (!id) {
        throw new Error('State ID is required for updating');
      }
      return imsClient.inventory.updateState(id, values);
    },
  });

  /**
   * Enhanced mutation for updating a state with toast notifications,
   * query invalidation, and navigation
   */
  const updateState = useToastMutation({
    mutation: updateStateMutation,
    messages: updateMessages,
    onSuccess: (data: states.State) => {
      invalidateStates();
      router.push(`/states/${data.id}`);
    },
  });

  // Delete State
  /**
   * Base mutation for deleting a state
   */
  const deleteStateMutation = useMutation({
    mutationFn: (id: number) => {
      if (!id) {
        throw new Error('State ID is required for deletion');
      }
      return imsClient.inventory.deleteState(id);
    },
  });

  /**
   * Enhanced mutation for deleting a state with toast notifications,
   * query invalidation, and navigation
   */
  const deleteState = useToastMutation({
    mutation: deleteStateMutation,
    messages: deleteMessages,
    onSuccess: () => {
      invalidateStates();
      router.push('/states');
    },
  });

  return {
    createState,
    updateState,
    deleteState,
  };
}
