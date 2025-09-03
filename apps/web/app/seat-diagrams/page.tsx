'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import SeatDiagramsTable from '@/seat-diagrams/components/seat-diagrams-table';
import routes from '@/services/routes';

export default function SeatDiagramsPage() {
  const t = useTranslations('seatDiagrams');

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        createHref={routes.seatDiagrams.new}
        createLabel={t('actions.create')}
      />
      <Suspense>
        <SeatDiagramsTable />
      </Suspense>
    </div>
  );
}
