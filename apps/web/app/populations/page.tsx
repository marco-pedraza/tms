'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import PopulationsTable from '@/populations/components/populations-table';
import routes from '@/services/routes';

export default function PopulationsPage() {
  const t = useTranslations('populations');

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        createHref={routes.populations.new}
        createLabel={t('actions.create')}
      />
      <Suspense>
        <PopulationsTable />
      </Suspense>
    </div>
  );
}
