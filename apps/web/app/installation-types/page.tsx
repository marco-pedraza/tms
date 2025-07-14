'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import InstallationTypesTable from '@/installation-types/components/installation-types-table';
import routes from '@/services/routes';

export default function InstallationTypesPage() {
  const t = useTranslations('installationTypes');

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        createHref={routes.installationTypes.new}
        createLabel={t('actions.create')}
      />
      <Suspense>
        <InstallationTypesTable />
      </Suspense>
    </div>
  );
}
