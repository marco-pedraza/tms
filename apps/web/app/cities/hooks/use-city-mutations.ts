import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import imsClient from '@/lib/imsClient';
import type { cities } from '@repo/ims-client';
import type { CityFormValues } from '../city-form';
import { useToastMutation } from '@/hooks/use-toast-mutation';

/**
 * Custom hook for city-related CRUD operations with toast notifications.
 *
 * This hook provides a set of enhanced mutations for creating, updating, and deleting
 * cities. Each mutation includes toast notifications, automatic query invalidation,
 * and navigation to appropriate routes after successful operations.
 *
 * @returns Object containing enhanced mutations for city operations
 * @returns {Object} result.createCity - Mutation for creating a new city
 * @returns {Object} result.updateCity - Mutation for updating an existing city
 * @returns {Object} result.deleteCity - Mutation for deleting a city
 */
export function useCityMutations() {
  const { t } = useTranslation('cities');
  const router = useRouter();
  const queryClient = useQueryClient();

  /**
   * Invalidates cities-related queries to refresh data
   */
  const invalidateCities = () => {
    queryClient.invalidateQueries({ queryKey: ['cities'] });
  };

  // Create City
  /**
   * Base mutation for creating a new city
   */
  const createCityMutation = useMutation({
    mutationFn: (values: CityFormValues) =>
      imsClient.inventory.createCity(values),
  });

  /**
   * Enhanced mutation for creating a city with toast notifications,
   * query invalidation, and navigation
   */
  const createCity = useToastMutation({
    mutation: createCityMutation,
    messages: {
      loading: t('messages.create.loading'),
      success: t('messages.create.success'),
      error: t('messages.create.error'),
    },
    onSuccess: (data: cities.City) => {
      invalidateCities();
      router.push(`/cities/${data.id}`);
    },
  });

  // Update City
  /**
   * Base mutation for updating an existing city
   */
  const updateCityMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: CityFormValues }) => {
      if (!id) {
        throw new Error('City ID is required for updating');
      }
      return imsClient.inventory.updateCity(id, values);
    },
  });

  /**
   * Enhanced mutation for updating a city with toast notifications,
   * query invalidation, and navigation
   */
  const updateCity = useToastMutation({
    mutation: updateCityMutation,
    messages: {
      loading: t('messages.update.loading'),
      success: t('messages.update.success'),
      error: t('messages.update.error'),
    },
    onSuccess: (data: cities.City) => {
      invalidateCities();
      router.push(`/cities/${data.id}`);
    },
  });

  // Delete City
  /**
   * Base mutation for deleting a city
   */
  const deleteCityMutation = useMutation({
    mutationFn: (id: number) => {
      if (!id) {
        throw new Error('City ID is required for deletion');
      }
      return imsClient.inventory.deleteCity(id);
    },
  });

  /**
   * Enhanced mutation for deleting a city with toast notifications,
   * query invalidation, and navigation
   */
  const deleteCity = useToastMutation({
    mutation: deleteCityMutation,
    messages: {
      loading: t('messages.delete.loading'),
      success: t('messages.delete.success'),
      error: t('messages.delete.error'),
    },
    onSuccess: () => {
      invalidateCities();
      router.push('/cities');
    },
  });

  return {
    createCity,
    updateCity,
    deleteCity,
  };
}
