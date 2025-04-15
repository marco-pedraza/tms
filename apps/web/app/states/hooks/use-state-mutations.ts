import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import imsClient from '@/lib/imsClient';
import type { states } from '@repo/ims-client';
import type { StateFormValues } from '../state-form';
import { useToastMutation } from '@/hooks/use-toast-mutation';

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
  const { t } = useTranslation('states');
  const router = useRouter();
  const queryClient = useQueryClient();

  /**
   * Invalidates states-related queries to refresh data
   */
  const invalidateStates = () => {
    queryClient.invalidateQueries({ queryKey: ['states'] });
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
    messages: {
      loading: t('messages.create.loading'),
      success: t('messages.create.success'),
      error: t('messages.create.error'),
    },
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
    messages: {
      loading: t('messages.update.loading'),
      success: t('messages.update.success'),
      error: t('messages.update.error'),
    },
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
    messages: {
      loading: t('messages.delete.loading'),
      success: t('messages.delete.success'),
      error: t('messages.delete.error'),
    },
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
