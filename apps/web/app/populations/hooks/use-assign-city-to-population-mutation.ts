import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useToastMutation } from '@/hooks/use-toast-mutation';
import imsClient from '@/services/ims-client';

interface AssignCityToPopulationPayload {
  populationId: number;
  cityId: number;
}

export default function useAssignCityToPopulationMutation() {
  const tCities = useTranslations('cities');

  const assignCityToPopulationMutation = useMutation({
    mutationFn: (payload: AssignCityToPopulationPayload) =>
      imsClient.inventory.assignCityToPopulation(payload.populationId, {
        cityId: payload.cityId,
      }),
  });

  const assignCityToPopulationWithToast = useToastMutation({
    mutation: assignCityToPopulationMutation,
    messages: {
      loading: tCities('messages.assignPopulation.loading'),
      success: tCities('messages.assignPopulation.success'),
      error: tCities('messages.assignPopulation.error'),
    },
  });

  return assignCityToPopulationWithToast;
}
