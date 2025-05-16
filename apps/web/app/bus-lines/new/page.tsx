'use client';

import { useTranslations } from 'next-intl';
import BusLineForm from '@/bus-lines/components/bus-line-form';
import useBusLineMutations from '@/bus-lines/hooks/use-bus-line-mutations';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';

export default function NewBusLinePage() {
  const t = useTranslations('busLines');
  const tCommon = useTranslations('common');
  const { createBusLine } = useBusLineMutations();

  return (
    <div>
      <PageHeader
        title={t('actions.create')}
        backHref={routes.busLines.index}
        backLabel={t('actions.backToList')}
      />
      <BusLineForm
        onSubmit={createBusLine.mutateWithToast}
        submitButtonText={tCommon('actions.create')}
      />
    </div>
  );
}
