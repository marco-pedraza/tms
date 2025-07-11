'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import CityForm, { CityFormValues } from '@/cities/components/city-form';
import PageHeader from '@/components/page-header';
import { useToastMutation } from '@/hooks/use-toast-mutation';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default function NewCityPage() {
  const tCities = useTranslations('cities');
  const assignCityToPopulationMutation = useMutation({
    mutationFn: async ({
      populationId,
      cityId,
    }: {
      populationId: number;
      cityId: number;
    }) => {
      await imsClient.inventory.assignCityToPopulation(populationId, {
        cityId,
      });
      return {
        cityId,
      };
    },
  });
  const router = useRouter();
  const assignCityToPopulation = useToastMutation({
    mutation: assignCityToPopulationMutation,
    messages: {
      loading: tCities('messages.assignPopulation.loading'),
      success: tCities('messages.assignPopulation.success'),
      error: tCities('messages.assignPopulation.error'),
    },
    onSuccess: ({ cityId }) => {
      router.push(routes.cities.getDetailsRoute(cityId.toString()));
    },
    onError: (_, params) => {
      router.push(routes.cities.getDetailsRoute(params.cityId.toString()));
    },
  });
  const queryClient = useQueryClient();
  const createCityMutation = useMutation({
    mutationFn: async (values: CityFormValues) => {
      const city = await imsClient.inventory.createCity(values);
      return {
        city,
        populationId: values.populationId,
      };
    },
  });
  const createCity = useToastMutation({
    mutation: createCityMutation,
    messages: {
      loading: tCities('messages.create.loading'),
      success: tCities('messages.create.success'),
      error: tCities('messages.create.error'),
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      if (data.populationId) {
        assignCityToPopulation.mutateWithToast({
          populationId: data.populationId,
          cityId: data.city.id,
        });
      } else {
        router.push(routes.cities.getDetailsRoute(data.city.id.toString()));
      }
    },
  });

  return (
    <div>
      <PageHeader
        title={tCities('new.title')}
        description={tCities('new.description')}
        backHref={routes.cities.index}
        backLabel={tCities('actions.backToList')}
      />

      <CityForm onSubmit={createCity.mutateWithToast} />
    </div>
  );
}
