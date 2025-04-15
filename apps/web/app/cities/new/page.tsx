'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/ui-components';
import CityForm from '../city-form';
import { useCityMutations } from '../hooks/use-city-mutations';

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
