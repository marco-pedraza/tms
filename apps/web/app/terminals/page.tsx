'use client';

import { useTranslations } from 'next-intl';
import TerminalsTable from '@/app/terminals/components/terminals-table';
import PageHeader from '@/components/page-header';

/**
 * Main page component for managing terminals
 */
export default function TerminalsPage() {
  const t = useTranslations('terminals');

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        createHref="/terminals/new"
        createLabel={t('actions.create')}
      />
      <TerminalsTable />
    </div>
  );
}
