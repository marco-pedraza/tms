'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';
import TransportersTable from '@/transporters/components/transporters-table';

export default function TransportersPage() {
  const t = useTranslations('transporters');

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        createHref={routes.transporters.new}
        createLabel={t('actions.create')}
      />
      <TransportersTable />
    </div>
  );
}
