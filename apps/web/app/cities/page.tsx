'use client';

import { useTranslations } from 'next-intl';
import CitiesTable from '@/cities/components/cities-table';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';

/**
 * Main page component for managing cities
 */
export default function CitiesPage() {
  const t = useTranslations('cities');

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        createHref={routes.cities.new}
        createLabel={t('actions.create')}
      />
      <CitiesTable />
    </div>
  );
}
