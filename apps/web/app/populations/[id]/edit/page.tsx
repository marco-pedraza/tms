'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import { useToastMutation } from '@/hooks/use-toast-mutation';
import PopulationForm, {
  PopulationFormValues,
} from '@/populations/components/population-form';
import PopulationFormSkeleton from '@/populations/components/population-form-skeleton';
import usePopulationDetailsParams from '@/populations/hooks/use-population-details-params';
import useQueryPopulation from '@/populations/hooks/use-query-population';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default function EditPopulationPage() {
  const tPopulations = useTranslations('populations');
  const { populationId, isValidId } = usePopulationDetailsParams();
  const { data, isLoading } = useQueryPopulation({
    populationId,
    enabled: isValidId,
  });
  const router = useRouter();
  const updateAssignedCitiesToPopulationMutation = useMutation({
    mutationFn: (values: { cityIds: number[] }) =>
      imsClient.inventory.assignCitiesToPopulation(populationId, values),
  });
  const updateAssignedCitiesToPopulation = useToastMutation({
    mutation: updateAssignedCitiesToPopulationMutation,
    messages: {
      loading: tPopulations('messages.assignCities.loading'),
      success: tPopulations('messages.assignCities.success'),
      error: tPopulations('messages.assignCities.error'),
    },
    onSuccess: () => {
      router.push(routes.populations.getDetailsRoute(populationId.toString()));
    },
    onError: () => {
      router.push(routes.populations.getDetailsRoute(populationId.toString()));
    },
  });
  const queryClient = useQueryClient();
  const updatePopulationMutation = useMutation({
    mutationFn: async (values: PopulationFormValues) => {
      const population = await imsClient.inventory.updatePopulation(
        populationId,
        values,
      );
      return {
        population,
        cityIds: values.cities.map((stringId) => parseInt(stringId)),
      };
    },
  });
  const updatePopulation = useToastMutation({
    mutation: updatePopulationMutation,
    messages: {
      loading: tPopulations('messages.update.loading'),
      success: tPopulations('messages.update.success'),
      error: tPopulations('messages.update.error'),
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['populations'] });
      updateAssignedCitiesToPopulation.mutateWithToast({
        cityIds: data.cityIds,
      });
    },
  });

  if (isLoading) {
    return <PopulationFormSkeleton />;
  }

  if (!data) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={tPopulations('edit.title')}
        description={data.name}
        backHref={routes.populations.index}
      />
      <PopulationForm
        defaultValues={{
          ...data,
          description: data.description ?? '',
          cities: data.cities.map((city) => city.id.toString()),
        }}
        populationId={data.id}
        onSubmit={updatePopulation.mutateWithToast}
      />
    </div>
  );
}
