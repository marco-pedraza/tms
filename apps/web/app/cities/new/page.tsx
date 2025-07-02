'use client';

import { useTranslations } from 'next-intl';
import CityForm from '@/cities/components/city-form';
import useCityMutations from '@/cities/hooks/use-city-mutations';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';

export default function NewCityPage() {
  const { create: createCity } = useCityMutations();
  const t = useTranslations('cities');

  return (
    <div>
      <PageHeader
        title={t('new.title')}
        description={t('new.description')}
        backHref={routes.cities.index}
        backLabel={t('actions.backToList')}
      />

      <CityForm onSubmit={createCity.mutateWithToast} />
    </div>
  );
}
