'use client';

import { useTranslations } from 'next-intl';
import BusModelForm from '@/bus-models/components/bus-model-form';
import type { BusModelFormValues } from '@/bus-models/components/bus-model-form';
import useBusModelMutations from '@/bus-models/hooks/use-bus-model-mutations';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';

export default function NewBusModelPage() {
  const t = useTranslations('busModels');
  const { create: createBusModel } = useBusModelMutations();

  const handleSubmit = (values: BusModelFormValues) =>
    createBusModel.mutateWithToast({
      ...values,
      year: values.year ?? new Date().getFullYear(),
      defaultBusDiagramModelId: 1,
      seatingCapacity: values.seatingCapacity ?? 0,
    });

  return (
    <div>
      <PageHeader
        title={t('actions.create')}
        backHref={routes.busModels.index}
        backLabel={t('actions.backToList')}
      />
      <BusModelForm onSubmit={handleSubmit} />
    </div>
  );
}
