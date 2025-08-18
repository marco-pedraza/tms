'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import BusForm from '@/buses/components/bus-form';
import { BusFormValues } from '@/buses/components/bus-form';
import BusFormSkeleton from '@/buses/components/bus-form-skeleton';
import useQueryBus from '@/buses/hooks/use-query-bus';
import useQueryNextValidBusStatuses from '@/buses/hooks/use-query-next-valid-bus-statuses';
import PageHeader from '@/components/page-header';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import { useToastMutation } from '@/hooks/use-toast-mutation';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default function EditBusPage() {
  const tBuses = useTranslations('buses');
  const { itemId: busId, isValidId } = useCollectionItemDetailsParams();
  const { data, isLoading } = useQueryBus({
    busId,
    enabled: isValidId,
  });
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: nextValidStatuses, isLoading: isNextValidStatusesLoading } =
    useQueryNextValidBusStatuses({
      busId,
      enabled: isValidId,
    });

  const updateBusMutation = useMutation({
    mutationFn: async (values: BusFormValues) =>
      await imsClient.inventory.updateBus(busId, values),
  });

  const updateBus = useToastMutation({
    mutation: updateBusMutation,
    messages: {
      loading: tBuses('messages.update.loading'),
      success: tBuses('messages.update.success'),
      error: tBuses('messages.update.error'),
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      router.push(routes.buses.getDetailsRoute(data.id.toString()));
    },
  });

  if (isLoading || isNextValidStatusesLoading) {
    return <BusFormSkeleton />;
  }

  if (!data) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={tBuses('edit.title')}
        description={data.registrationNumber}
        backHref={routes.buses.index}
      />
      <BusForm
        defaultValues={data}
        onSubmit={updateBus.mutateWithToast}
        nextValidStatuses={nextValidStatuses?.data}
      />
    </div>
  );
}
