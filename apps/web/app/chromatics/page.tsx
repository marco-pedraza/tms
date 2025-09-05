'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import ChromaticsTable from '@/chromatics/components/chromatics-table';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';

export default function ChromaticsPage() {
  const t = useTranslations('chromatics');

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        createHref={routes.chromatics.new}
        createLabel={t('actions.create')}
      />
      <Suspense>
        <ChromaticsTable />
      </Suspense>
    </div>
  );
}
