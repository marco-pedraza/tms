'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import AmenitiesTable from '@/amenities/components/amenities-table';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';

export default function AmenitiesPage() {
  const t = useTranslations('amenities');

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        createHref={routes.amenities.new}
        createLabel={t('actions.create')}
      />
      <Suspense>
        <AmenitiesTable />
      </Suspense>
    </div>
  );
}
