'use client';

import { useTranslations } from 'next-intl';
import CityForm from '@/cities/city-form';
import { useCityMutations } from '@/cities/hooks/use-city-mutations';
import PageHeader from '@/components/page-header';

export default function NewCityPage() {
  const { createCity } = useCityMutations();
  const t = useTranslations('cities');
  const tCommon = useTranslations('common');

  return (
    <div>
      <PageHeader
        title={t('new.title')}
        description={t('new.description')}
        backHref="/cities"
        backLabel={t('actions.backToList')}
      />

      <CityForm
        onSubmit={createCity.mutateWithToast}
        submitButtonText={tCommon('actions.create')}
      />
    </div>
  );
}
