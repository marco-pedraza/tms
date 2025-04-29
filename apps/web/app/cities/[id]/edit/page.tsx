'use client';

import { Params } from 'next/dist/server/request/params';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import CityForm, { CityFormValues } from '@/cities/components/city-form';
import CityFormSkeleton from '@/cities/components/city-form-skeleton';
import CityNotFound from '@/cities/components/city-not-found';
import { useCityMutations } from '@/cities/hooks/use-city-mutations';
import useQueryCity from '@/cities/hooks/use-query-city';
import PageHeader from '@/components/page-header';

interface EditCityPageParams extends Params {
  id: string;
}

const isNumber = (value: string) => {
  return !isNaN(Number(value));
};

export default function EditCityPage() {
  const params = useParams<EditCityPageParams>();
  const cityId = parseInt(params.id);
  const { updateCity } = useCityMutations();
  const tCities = useTranslations('cities');
  const tCommon = useTranslations('common');

  const { data, status, error } = useQueryCity({
    cityId,
    enabled: isNumber(params.id),
  });

  if (!isNumber(params.id)) {
    return <div>{tCommon('errors.invalidId')}</div>;
  }

  if (status === 'pending') {
    return <CityFormSkeleton />;
  }

  if (error || !data) {
    return <CityNotFound />;
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
