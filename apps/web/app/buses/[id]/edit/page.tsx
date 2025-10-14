'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import BusForm from '@/buses/components/bus-form';
import { BusFormValues } from '@/buses/components/bus-form';
import BusFormSkeleton from '@/buses/components/bus-form-skeleton';
import useQueryBus from '@/buses/hooks/use-query-bus';
import useQueryBusTechnologies from '@/buses/hooks/use-query-bus-technologies';
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
  const { data: technologies, isLoading: isLoadingTechnologies } =
    useQueryBusTechnologies({
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

  const assignDriversMutation = useMutation({
    mutationKey: ['buses', 'assignDrivers'],
    mutationFn: async (payload: { busId: number; driverIds: number[] }) => {
      await imsClient.inventory.assignDriversToBusCrew(payload.busId, {
        driverIds: payload.driverIds,
      });

      return {
        busId: payload.busId,
        driverIds: payload.driverIds,
      };
    },
  });

  const assignDrivers = useToastMutation({
    mutation: assignDriversMutation,
    messages: {
      loading: tBuses('messages.assignDrivers.loading'),
      success: tBuses('messages.assignDrivers.success'),
      error: tBuses('messages.assignDrivers.error'),
    },
  });

  const updateBusMutation = useMutation({
    mutationFn: async (values: BusFormValues) => {
      const bus = await imsClient.inventory.updateBus(busId, values);
      return {
        bus,
        technologyIds: values.technologyIds,
        driverIds: values.driverIds,
      };
    },
  });

  const updateBusWithToast = useToastMutation({
    mutation: updateBusMutation,
    messages: {
      loading: tBuses('messages.update.loading'),
      success: tBuses('messages.update.success'),
      error: tBuses('messages.update.error'),
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      assignDrivers.mutateWithToast({
        busId: data.bus.id,
        driverIds: data.driverIds ?? [],
      });
      assignTechnologies.mutateWithToast({
        busId: data.bus.id,
        technologyIds: data.technologyIds ?? [],
      });
      router.push(routes.buses.getDetailsRoute(data.bus.id.toString()));
    },
  });

  if (isLoading || isNextValidStatusesLoading || isLoadingTechnologies) {
    return <BusFormSkeleton />;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <PageHeader
        title={tBuses('edit.title')}
        description={data.registrationNumber}
        backHref={routes.buses.index}
      />
      <BusForm
        defaultValues={{
          ...data,
          driverIds: data.busCrew?.map((driver) => driver.driverId) ?? [],
          technologyIds: technologies?.map((technology) => technology.id) ?? [],
        }}
        onSubmit={updateBusWithToast.mutateWithToast}
        nextValidStatuses={nextValidStatuses?.data}
      />
    </div>
  );
}
