'use client';

import { PageHeader } from '@/components/ui-components';
import CityForm from '../city-form';
import { useCityMutations } from '../hooks/use-city-mutations';
import { useTranslation } from 'react-i18next';

export default function NewCityPage() {
  const { createCity } = useCityMutations();
  const { t } = useTranslation('cities');
  return (
    <div>
      <PageHeader
        title={t('new.title')}
        description={t('new.description')}
        backHref="/cities"
      />

      <CityForm onSubmit={createCity.mutateWithToast} />
    </div>
  );
}
