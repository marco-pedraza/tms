'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import ServiceTypesTable from '@/service-types/components/service-types-table';
import routes from '@/services/routes';

export default function ServiceTypesPage() {
  const t = useTranslations('serviceTypes');

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        createHref={routes.serviceTypes.new}
        createLabel={t('actions.create')}
      />
      <Suspense>
        <ServiceTypesTable />
      </Suspense>
    </div>
  );
}
