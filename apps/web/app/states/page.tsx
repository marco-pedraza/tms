'use client';

import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/ui-components';
import StatesTable from './states-table';

export default function StatesPage() {
  const { t } = useTranslation(['states', 'common']);

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        createHref="/states/new"
        createLabel={t('actions.create')}
      />
      <StatesTable />
    </div>
  );
}
