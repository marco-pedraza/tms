'use client';

import { useTranslations } from 'next-intl';
import CityForm, { CityFormValues } from '@/cities/components/city-form';
import CityFormSkeleton from '@/cities/components/city-form-skeleton';
import useCityDetailsParams from '@/cities/hooks/use-city-details-params';
import { useCityMutations } from '@/cities/hooks/use-city-mutations';
import useQueryCity from '@/cities/hooks/use-query-city';
import PageHeader from '@/components/page-header';

export default function EditCityPage() {
  const { cityId, isValidId } = useCityDetailsParams();
  const { updateCity } = useCityMutations();
  const tCities = useTranslations('cities');
  const tCommon = useTranslations('common');

  const { data, status } = useQueryCity({
    cityId,
    enabled: isValidId,
  });

  // Show the form skeleton only if we're loading and don't have cached data
  if (status === 'pending' && !data) {
    return <CityFormSkeleton />;
  }

  if (!data) {
    return null;
  }

  const handleSubmit = (values: CityFormValues) => {
    return updateCity.mutateWithToast({ id: cityId, values });
  };

  return (
    <div>
      <PageHeader
        title={tCities('edit.title')}
        description={data?.name}
        backHref="/cities"
      />
      <CityForm
        defaultValues={data}
        onSubmit={handleSubmit}
        submitButtonText={tCommon('actions.update')}
      />
    </div>
  );
}
