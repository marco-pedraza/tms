'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import BusModelsTable from '@/bus-models/components/bus-models-table';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';

export default function BusModelsPage() {
  const t = useTranslations('busModels');

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        createHref={routes.busModels.new}
        createLabel={t('actions.create')}
      />
      <Suspense>
        <BusModelsTable />
      </Suspense>
    </div>
  );
}
