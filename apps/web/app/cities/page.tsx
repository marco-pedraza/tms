'use client';

import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/ui-components';
import CitiesTable from './cities-table';

/**
 * Main page component for managing cities
 */
export default function CitiesPage() {
  const { t } = useTranslation(['cities', 'common']);

  return (
    <div>
      <PageHeader
        title={t('cities:title')}
        description={t('cities:description')}
        createHref="/cities/new"
        createLabel={t('cities:actions.create')}
      />
      <CitiesTable />
    </div>
  );
}
