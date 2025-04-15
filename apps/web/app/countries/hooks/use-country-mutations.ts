import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import imsClient from '@/lib/imsClient';
import type { countries } from '@repo/ims-client';
import type { CountryFormValues } from '../country-form';
import { useToastMutation } from '@/hooks/use-toast-mutation';

/**
 * Custom hook for country-related CRUD operations with toast notifications.
 *
 * This hook provides a set of enhanced mutations for creating, updating, and deleting
 * countries. Each mutation includes toast notifications, automatic query invalidation,
 * and navigation to appropriate routes after successful operations.
 *
 * @returns Object containing enhanced mutations for country operations
 * @returns {Object} result.createCountry - Mutation for creating a new country
 * @returns {Object} result.updateCountry - Mutation for updating an existing country
 * @returns {Object} result.deleteCountry - Mutation for deleting a country
 */
export function useCountryMutations() {
  const { t } = useTranslation('countries');
  const router = useRouter();
  const queryClient = useQueryClient();

  /**
   * Invalidates countries-related queries to refresh data
   */
  const invalidateCountries = () => {
    queryClient.invalidateQueries({ queryKey: ['countries'] });
  };

  // Create Country
  /**
   * Base mutation for creating a new country
   */
  const createCountryMutation = useMutation({
    mutationFn: (values: CountryFormValues) =>
      imsClient.inventory.createCountry(values),
  });

  /**
   * Enhanced mutation for creating a country with toast notifications,
   * query invalidation, and navigation
   */
  const createCountry = useToastMutation({
    mutation: createCountryMutation,
    messages: {
      loading: t('messages.create.loading'),
      success: t('messages.create.success'),
      error: t('messages.create.error'),
    },
    onSuccess: (data: countries.Country) => {
      invalidateCountries();
      router.push(`/countries/${data.id}`);
    },
  });

  // Update Country
  /**
   * Base mutation for updating an existing country
   */
  const updateCountryMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: CountryFormValues }) => {
      if (!id) {
        throw new Error('Country ID is required for updating');
      }
      return imsClient.inventory.updateCountry(id, values);
    },
  });

  /**
   * Enhanced mutation for updating a country with toast notifications,
   * query invalidation, and navigation
   */
  const updateCountry = useToastMutation({
    mutation: updateCountryMutation,
    messages: {
      loading: t('messages.update.loading'),
      success: t('messages.update.success'),
      error: t('messages.update.error'),
    },
    onSuccess: (data: countries.Country) => {
      invalidateCountries();
      router.push(`/countries/${data.id}`);
    },
  });

  // Delete Country
  /**
   * Base mutation for deleting a country
   */
  const deleteCountryMutation = useMutation({
    mutationFn: (id: number) => {
      if (!id) {
        throw new Error('Country ID is required for deletion');
      }
      return imsClient.inventory.deleteCountry(id);
    },
  });

  /**
   * Enhanced mutation for deleting a country with toast notifications,
   * query invalidation, and navigation
   */
  const deleteCountry = useToastMutation({
    mutation: deleteCountryMutation,
    messages: {
      loading: t('messages.delete.loading'),
      success: t('messages.delete.success'),
      error: t('messages.delete.error'),
    },
    onSuccess: () => {
      invalidateCountries();
      router.push('/countries');
    },
  });

  return {
    createCountry,
    updateCountry,
    deleteCountry,
  };
}
