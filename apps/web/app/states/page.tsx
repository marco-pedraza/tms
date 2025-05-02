'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import StatesTable from '@/states/components/states-table';

export default function StatesPage() {
  const t = useTranslations('states');

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        createHref="/states/new"
        createLabel={t('actions.create')}
      />
      <StatesTable />
    </div>
  );
}
