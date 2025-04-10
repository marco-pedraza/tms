import { useToastMutation } from '@/hooks/use-toast-mutation';
import { useTranslation } from 'react-i18next';
import imsClient from '@/lib/imsClient';
import type { states } from '@repo/ims-client';
import type { StateFormValues } from '../state-form';

export function useStateMutations() {
  const { t } = useTranslation('states');

  const createState = useToastMutation<states.State, StateFormValues>({
    mutationFn: (values) => imsClient.inventory.createState(values),
    messages: {
      loading: t('messages.create.loading'),
      success: t('messages.create.success'),
      error: t('messages.create.error'),
    },
    invalidateQueries: ['states'],
    redirectTo: (data: states.State) => `/states/${data.id}`,
  });

  const updateState = useToastMutation<
    states.State,
    { id: number; values: StateFormValues }
  >({
    mutationFn: ({ id, values }) => {
      if (!id) {
        throw new Error('State ID is required for updating');
      }
      return imsClient.inventory.updateState(id, values);
    },
    messages: {
      loading: t('messages.update.loading'),
      success: t('messages.update.success'),
      error: t('messages.update.error'),
    },
    invalidateQueries: ['states'],
    redirectTo: ({ id }) => `/states/${id}`,
  });

  const deleteState = useToastMutation<states.State, number>({
    mutationFn: (id) => {
      if (!id) {
        throw new Error('State ID is required for deletion');
      }
      return imsClient.inventory.deleteState(id);
    },
    messages: {
      loading: t('messages.delete.loading'),
      success: t('messages.delete.success'),
      error: t('messages.delete.error'),
    },
    invalidateQueries: ['states'],
    redirectTo: '/states',
  });

  return {
    createState,
    updateState,
    deleteState,
  };
}
