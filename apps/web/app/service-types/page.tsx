'use client';

import { useTranslations } from 'next-intl';
import ServiceTypesTable from '@/app/service-types/components/service-types-table';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';

export default function ServiceTypesPage() {
  const t = useTranslations('serviceTypes');

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        createHref={routes.serviceTypes.new}
        createLabel={t('actions.create')}
      />
      <ServiceTypesTable />
    </div>
  );
}
