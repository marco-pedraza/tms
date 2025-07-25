'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import LabelsMetrics from '@/labels/components/labels-metrics';
import LabelsTable from '@/labels/components/labels-table';
import routes from '@/services/routes';

export default function LabelsPage() {
  const t = useTranslations('labels');

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        createHref={routes.labels.new}
        createLabel={t('actions.create')}
      />
      <LabelsMetrics />
      <Suspense>
        <LabelsTable />
      </Suspense>
    </div>
  );
}
