'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import NodesTable from '@/nodes/components/nodes-table';
import routes from '@/services/routes';

export default function NodesPage() {
  const t = useTranslations('nodes');

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        createHref={routes.nodes.new}
        createLabel={t('actions.create')}
      />
      <Suspense>
        <NodesTable />
      </Suspense>
    </div>
  );
}
