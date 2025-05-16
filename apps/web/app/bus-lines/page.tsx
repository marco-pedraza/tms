'use client';

import { useTranslations } from 'next-intl';
import BusLinesTable from '@/bus-lines/components/bus-lines-table';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';

export default function BusLinesPage() {
  const t = useTranslations('busLines');

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        createHref={routes.busLines.new}
        createLabel={t('actions.create')}
      />
      <BusLinesTable />
    </div>
  );
}
