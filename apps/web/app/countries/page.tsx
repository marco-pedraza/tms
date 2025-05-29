'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import CountriesTable from '@/countries/components/countries-table';
import routes from '@/services/routes';

export default function CountriesPage() {
  const t = useTranslations('countries');

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        createHref={routes.countries.new}
        createLabel={t('actions.create')}
      />
      <Suspense>
        <CountriesTable />
      </Suspense>
    </div>
  );
}
