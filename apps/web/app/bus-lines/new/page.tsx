'use client';

import { useTranslations } from 'next-intl';
import BusLineForm, {
  BusLineFormValues,
} from '@/bus-lines/components/bus-line-form';
import useBusLineMutations from '@/bus-lines/hooks/use-bus-line-mutations';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';

export default function NewBusLinePage() {
  const t = useTranslations('busLines');
  const { create } = useBusLineMutations();

  const onSubmit = (values: BusLineFormValues) => {
    return create.mutateWithToast({
      ...values,
      email: values.email ?? '',
      phone: values.phone ?? '',
    });
  };

  return (
    <div>
      <PageHeader
        title={t('actions.create')}
        backHref={routes.busLines.index}
        backLabel={t('actions.backToList')}
      />
      <BusLineForm onSubmit={onSubmit} />
    </div>
  );
}
