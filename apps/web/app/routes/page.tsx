'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import RoutesTable from '@/routes/components/routes-table';
import routes from '@/services/routes';

export default function RoutesPage() {
  const t = useTranslations('routes');

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        createHref={routes.routes.new}
        createLabel={t('actions.create')}
      />
      <Suspense>
        <RoutesTable />
      </Suspense>
    </div>
  );
}
