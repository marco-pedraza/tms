'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import RolesTable from '@/roles/components/roles-table';
import routes from '@/services/routes';

export default function RolesPage() {
  const t = useTranslations('roles');

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        createHref={routes.roles.new}
        createLabel={t('actions.create')}
      />
      <Suspense>
        <RolesTable />
      </Suspense>
    </div>
  );
}
