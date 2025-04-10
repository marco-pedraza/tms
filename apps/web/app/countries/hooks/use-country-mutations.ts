import { useToastMutation } from '@/hooks/use-toast-mutation';
import { useTranslation } from 'react-i18next';
import imsClient from '@/lib/imsClient';
import type { countries } from '@repo/ims-client';
import type { CountryFormValues } from '../country-form';

export function useCountryMutations() {
  const { t } = useTranslation('countries');

  const createCountry = useToastMutation<countries.Country, CountryFormValues>({
    mutationFn: (values) => imsClient.inventory.createCountry(values),
    messages: {
      loading: t('messages.create.loading'),
      success: t('messages.create.success'),
      error: t('messages.create.error'),
    },
    invalidateQueries: ['countries'],
    redirectTo: (data: countries.Country) => `/countries/${data.id}`,
  });

  const updateCountry = useToastMutation<
    countries.Country,
    { id: number; values: CountryFormValues }
  >({
    mutationFn: ({ id, values }) => {
      if (!id) {
        throw new Error('Country ID is required for updating');
      }
      return imsClient.inventory.updateCountry(id, values);
    },
    messages: {
      loading: t('messages.update.loading'),
      success: t('messages.update.success'),
      error: t('messages.update.error'),
    },
    invalidateQueries: ['countries'],
    redirectTo: ({ id }) => `/countries/${id}`,
  });

  const deleteCountry = useToastMutation<countries.Country, number>({
    mutationFn: (id) => {
      if (!id) {
        throw new Error('Country ID is required for deletion');
      }
      return imsClient.inventory.deleteCountry(id);
    },
    messages: {
      loading: t('messages.delete.loading'),
      success: t('messages.delete.success'),
      error: t('messages.delete.error'),
    },
    invalidateQueries: ['countries'],
    redirectTo: '/countries',
  });

  return {
    createCountry,
    updateCountry,
    deleteCountry,
  };
}
