'use client';

import { useTranslations } from 'next-intl';
import CitiesTable from '@/cities/components/cities-table';
import PageHeader from '@/components/page-header';

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
        createHref="/cities/new"
        createLabel={t('actions.create')}
      />
      <CitiesTable />
    </div>
  );
}
