'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import CityForm, { CityFormValues } from '@/cities/components/city-form';
import CityFormSkeleton from '@/cities/components/city-form-skeleton';
import useCityDetailsParams from '@/cities/hooks/use-city-details-params';
import useQueryCity from '@/cities/hooks/use-query-city';
import PageHeader from '@/components/page-header';
import { useToastMutation } from '@/hooks/use-toast-mutation';
import useQueryPopulationByAssignedCity from '@/populations/hooks/use-query-population-by-assigned-city';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default function EditCityPage() {
  const tCities = useTranslations('cities');
  const { cityId, isValidId } = useCityDetailsParams();
  const { data, isLoading } = useQueryCity({
    cityId,
    enabled: isValidId,
  });
  const { data: population, isLoading: isLoadingPopulation } =
    useQueryPopulationByAssignedCity({
      cityId,
      enabled: isValidId,
    });
  const router = useRouter();
  const assignCityToPopulationMutation = useMutation({
    mutationFn: ({
      populationId,
      cityId,
    }: {
      populationId: number;
      cityId: number;
    }) => imsClient.inventory.assignCityToPopulation(populationId, { cityId }),
  });
  const assignCityToPopulation = useToastMutation({
    mutation: assignCityToPopulationMutation,
    messages: {
      loading: tCities('messages.assignPopulation.loading'),
      success: tCities('messages.assignPopulation.success'),
      error: tCities('messages.assignPopulation.error'),
    },
    onSuccess: () => {
      router.push(routes.cities.getDetailsRoute(cityId.toString()));
    },
    onError: () => {
      router.push(routes.cities.getDetailsRoute(cityId.toString()));
    },
  });
  const queryClient = useQueryClient();
  const updateCityMutation = useMutation({
    mutationFn: async (values: CityFormValues) => {
      const city = await imsClient.inventory.updateCity(cityId, values);
      return {
        city,
        populationId: values.populationId,
      };
    },
  });
  const updateCity = useToastMutation({
    mutation: updateCityMutation,
    messages: {
      loading: tCities('messages.update.loading'),
      success: tCities('messages.update.success'),
      error: tCities('messages.update.error'),
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      if (data.populationId && data.populationId !== population?.data?.id) {
        assignCityToPopulation.mutateWithToast({
          populationId: data.populationId,
          cityId: data.city.id,
        });
      } else {
        router.push(routes.cities.getDetailsRoute(data.city.id.toString()));
      }
    },
  });

  if (isLoading || isLoadingPopulation) {
    return <CityFormSkeleton />;
  }

  if (!data) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={tCities('edit.title')}
        description={data.name}
        backHref={routes.cities.index}
      />
      <CityForm
        defaultValues={{
          ...data,
          populationId: population?.data?.id || undefined,
        }}
        onSubmit={updateCity.mutateWithToast}
      />
    </div>
  );
}
