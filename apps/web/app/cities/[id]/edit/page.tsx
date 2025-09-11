'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import CityForm, { CityFormValues } from '@/cities/components/city-form';
import CityFormSkeleton from '@/cities/components/city-form-skeleton';
import useCityDetailsParams from '@/cities/hooks/use-city-details-params';
import useCityMutations from '@/cities/hooks/use-city-mutations';
import useQueryCity from '@/cities/hooks/use-query-city';
import PageHeader from '@/components/page-header';
import useAssignCityToPopulationMutation from '@/populations/hooks/use-assign-city-to-population-mutation';
import useQueryPopulationByAssignedCity from '@/populations/hooks/use-query-population-by-assigned-city';
import useUnassignCityFromPopulationMutation from '@/populations/hooks/use-unassign-city-from-population-mutation';
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
  const { update: updateCity } = useCityMutations();
  const unassignCityFromPopulation = useUnassignCityFromPopulationMutation();
  const assignCityToPopulation = useAssignCityToPopulationMutation();

  const onSubmit = async (values: CityFormValues) => {
    await updateCity.mutateWithToast(
      {
        id: cityId,
        values,
      },
      {
        standalone: false,
      },
    );
    try {
      if (values.populationId && values.populationId !== population?.data?.id) {
        await assignCityToPopulation.mutateWithToast(
          {
            populationId: values.populationId,
            cityId: cityId,
          },
          {
            standalone: false,
          },
        );
      }
      if (!values.populationId && population?.data?.id) {
        await unassignCityFromPopulation.mutateWithToast(
          {
            populationId: population.data.id,
            cityId: cityId,
          },
          {
            standalone: false,
          },
        );
      }
    } finally {
      router.push(routes.cities.getDetailsRoute(cityId.toString()));
    }
  };

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
        onSubmit={onSubmit}
      />
    </div>
  );
}
