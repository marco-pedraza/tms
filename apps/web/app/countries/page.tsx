'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/ui-components';
import CountriesTable from './countries-table';

export default function CountriesPage() {
  const t = useTranslations('countries');

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
