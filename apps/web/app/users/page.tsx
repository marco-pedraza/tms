'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';
import UsersTable from '@/users/components/users-table';

export default function UsersPage() {
  const t = useTranslations('users');

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        createHref={routes.users.new}
        createLabel={t('actions.create')}
      />
      <Suspense>
        <UsersTable />
      </Suspense>
    </div>
  );
}
