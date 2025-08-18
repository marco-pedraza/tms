'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import BusesTable from '@/buses/components/buses-table';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';

export default function BusesPage() {
  const t = useTranslations('buses');

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        createHref={routes.buses.new}
        createLabel={t('actions.create')}
      />
      <Suspense>
        <BusesTable />
      </Suspense>
    </div>
  );
}
