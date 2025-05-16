'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';
import TerminalsTable from '@/terminals/components/terminals-table';

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
        createHref={routes.terminals.new}
        createLabel={t('actions.create')}
      />
      <TerminalsTable />
    </div>
  );
}
