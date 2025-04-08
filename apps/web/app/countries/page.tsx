'use client';

import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/ui-components';
import CountriesTable from './countries-table';

export default function CountriesPage() {
  const { t } = useTranslation('countries');

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        createHref="/countries/new"
        createLabel={t('actions.create')}
      />
      <CountriesTable />
    </div>
  );
}
