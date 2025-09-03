'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';
import TechnologiesTable from '@/technologies/components/technologies-table';

export default function TechnologiesPage() {
  const t = useTranslations('technologies');

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        createHref={routes.technologies.new}
        createLabel={t('actions.create')}
      />
      <Suspense>
        <TechnologiesTable />
      </Suspense>
    </div>
  );
}
