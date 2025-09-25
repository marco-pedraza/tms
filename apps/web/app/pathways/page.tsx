'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import PathwaysTable from '@/pathways/components/pathways-table';
import routes from '@/services/routes';

export default function PathwaysPage() {
  const t = useTranslations('pathways');

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        createHref={routes.pathways.new}
        createLabel={t('actions.create')}
      />
      <Suspense>
        <PathwaysTable />
      </Suspense>
    </div>
  );
}
