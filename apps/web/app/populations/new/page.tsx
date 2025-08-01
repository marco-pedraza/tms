'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import { useToastMutation } from '@/hooks/use-toast-mutation';
import PopulationForm, {
  PopulationFormValues,
} from '@/populations/components/population-form';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default function NewPopulationPage() {
  const tPopulations = useTranslations('populations');
  const assignCitiesToPopulationMutation = useMutation({
    mutationFn: (params: { populationId: number; cityIds: number[] }) =>
      imsClient.inventory.assignCitiesToPopulation(params.populationId, {
        cityIds: params.cityIds,
      }),
  });
  const router = useRouter();
  const assignCitiesToPopulation = useToastMutation({
    mutation: assignCitiesToPopulationMutation,
    messages: {
      loading: tPopulations('messages.assignCities.loading'),
      success: tPopulations('messages.assignCities.success'),
      error: tPopulations('messages.assignCities.error'),
    },
    onSuccess: (data) => {
      router.push(routes.populations.getDetailsRoute(data.id.toString()));
    },
    onError: (_, params) => {
      router.push(
        routes.populations.getDetailsRoute(params.populationId.toString()),
      );
    },
  });
  const queryClient = useQueryClient();
  const createPopulationMutation = useMutation({
    mutationFn: async (values: PopulationFormValues) => {
      const population = await imsClient.inventory.createPopulation(values);
      return {
        population,
        cityIds: values.cities.map((stringId) => parseInt(stringId)),
      };
    },
  });
  const createPopulation = useToastMutation({
    mutation: createPopulationMutation,
    messages: {
      loading: tPopulations('messages.create.loading'),
      success: tPopulations('messages.create.success'),
      error: tPopulations('messages.create.error'),
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['populations'] });
      assignCitiesToPopulation.mutateWithToast({
        populationId: data.population.id,
        cityIds: data.cityIds,
      });
    },
  });

  return (
    <div>
      <PageHeader
        title={tPopulations('actions.create')}
        backHref={routes.populations.index}
        backLabel={tPopulations('actions.backToList')}
      />
      <PopulationForm onSubmit={createPopulation.mutateWithToast} />
    </div>
  );
}
