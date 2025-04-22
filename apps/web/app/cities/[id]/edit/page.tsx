'use client';

import { useParams } from 'next/navigation';
import PageHeader from '@/components/page-header';
import { Params } from 'next/dist/server/request/params';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import imsClient from '@/lib/imsClient';
import type { cities } from '@repo/ims-client';
import CityForm, { CityFormValues } from '../../city-form';
import { useCityMutations } from '../../hooks/use-city-mutations';
import { useTranslations } from 'next-intl';

interface EditCityPageParams extends Params {
  id: string;
}

const isNumber = (value: string) => {
  return !isNaN(Number(value));
};

export default function EditCityPage() {
  const params = useParams<EditCityPageParams>();
  const cityId = parseInt(params.id);
  const queryClient = useQueryClient();
  const { updateCity } = useCityMutations();
  const tCities = useTranslations('cities');
  const tCommon = useTranslations('common');

  const { data, status, error } = useQuery({
    queryKey: ['city', cityId],
    enabled: isNumber(params.id),
    queryFn: () => imsClient.inventory.getCity(cityId),
    initialData: () =>
      queryClient
        .getQueryData<cities.PaginatedCities>(['cities'])
        ?.data.find((city) => city.id === cityId),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState<cities.City[]>(['cities'])?.dataUpdatedAt,
  });

  if (!isNumber(params.id)) {
    return <div>{tCommon('errors.invalidId')}</div>;
  }

  if (status === 'pending') {
    return <div>{tCommon('states.loading')}</div>;
  }

  if (error) {
    return <div>{tCommon('errors.unexpected')}</div>;
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
