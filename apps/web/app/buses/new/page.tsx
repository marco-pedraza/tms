'use client';

import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import BusForm, { BusFormValues } from '@/buses/components/bus-form';
import PageHeader from '@/components/page-header';
import { useToastMutation } from '@/hooks/use-toast-mutation';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default function NewBusPage() {
  const tBuses = useTranslations('buses');

  const assignTechnologiesMutation = useMutation({
    mutationKey: ['buses', 'assignTechnologies'],
    mutationFn: async (payload: { busId: number; technologyIds: number[] }) => {
      await imsClient.inventory.assignTechnologiesToBus(payload.busId, {
        technologyIds: payload.technologyIds,
      });

      return {
        busId: payload.busId,
        technologyIds: payload.technologyIds,
      };
    },
  });

  const assignTechnologies = useToastMutation({
    mutation: assignTechnologiesMutation,
    messages: {
      loading: tBuses('messages.assignTechnologies.loading'),
      success: tBuses('messages.assignTechnologies.success'),
      error: tBuses('messages.assignTechnologies.error'),
    },
  });

  const createBusMutation = useMutation({
    mutationFn: async (values: BusFormValues) => {
      const bus = await imsClient.inventory.createBus(values);
      return {
        bus,
        technologyIds: values.technologyIds,
      };
    },
  });

  const createBusWithToast = useToastMutation({
    onSuccess: (data) => {
      assignTechnologies.mutateWithToast({
        busId: data.bus.id,
        technologyIds: data.technologyIds ?? [],
      });
    },
    mutation: createBusMutation,
    messages: {
      loading: tBuses('messages.create.loading'),
      success: tBuses('messages.create.success'),
      error: tBuses('messages.create.error'),
    },
  });

  return (
    <div>
      <PageHeader
        title={tBuses('actions.create')}
        backHref={routes.buses.index}
        backLabel={tBuses('actions.backToList')}
      />

      <BusForm onSubmit={createBusWithToast.mutateWithToast} />
    </div>
  );
}
