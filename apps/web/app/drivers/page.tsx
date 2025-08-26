'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import DriversTable from '@/drivers/components/drivers-table';
import routes from '@/services/routes';

export default function DriversPage() {
  const t = useTranslations('drivers');

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        createHref={routes.drivers.new}
        createLabel={t('actions.create')}
      />
      <Suspense>
        <DriversTable />
      </Suspense>
    </div>
  );
}
