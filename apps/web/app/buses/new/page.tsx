'use client';

import { useTranslations } from 'next-intl';
import BusForm, { BusFormValues } from '@/buses/components/bus-form';
import useBusMutations from '@/buses/hooks/use-bus-mutations';
import PageHeader from '@/components/page-header';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default function NewBusPage() {
  const tBuses = useTranslations('buses');
  const { create: createBus } = useBusMutations();

  const onSubmit = async (values: BusFormValues) => {
    const busModel = await imsClient.inventory.getBusModel(values.modelId);
    return createBus.mutateWithToast({
      ...values,
      seatDiagramId: busModel.defaultBusDiagramModelId,
    });
  };

  return (
    <div>
      <PageHeader
        title={tBuses('actions.create')}
        backHref={routes.buses.index}
        backLabel={tBuses('actions.backToList')}
      />

      <BusForm onSubmit={onSubmit} />
    </div>
  );
}
