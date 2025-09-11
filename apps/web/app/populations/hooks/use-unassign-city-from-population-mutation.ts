import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useToastMutation } from '@/hooks/use-toast-mutation';
import imsClient from '@/services/ims-client';

interface UnassignCityFromPopulationPayload {
  populationId: number;
  cityId: number;
}

export default function useUnassignCityFromPopulationMutation() {
  const tCities = useTranslations('cities');

  const unassignCityFromPopulationMutation = useMutation({
    mutationFn: (payload: UnassignCityFromPopulationPayload) =>
      imsClient.inventory.unassignCityFromPopulation(payload.populationId, {
        cityId: payload.cityId,
      }),
  });

  const unassignCityFromPopulationWithToast = useToastMutation({
    mutation: unassignCityFromPopulationMutation,
    messages: {
      loading: tCities('messages.unassignPopulation.loading'),
      success: tCities('messages.unassignPopulation.success'),
      error: tCities('messages.unassignPopulation.error'),
    },
  });

  return unassignCityFromPopulationWithToast;
}
