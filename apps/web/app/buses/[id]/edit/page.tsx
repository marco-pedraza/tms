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
import useUpdateBusSeatConfiguration from '@/buses/hooks/use-update-bus-seat-config';
import PageHeader from '@/components/page-header';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import { useToastMutation } from '@/hooks/use-toast-mutation';
import imsClient, { SpaceType } from '@/services/ims-client';
import routes from '@/services/routes';
import useQueryBusSeatConfiguration from '../../hooks/use-query-bus-seat-config';
import { convertBusSeatToSeatDiagramSpace } from '../../utils/convert-bus-seat-to-diagram-space';
import { createFloorsFromBusSeats } from '../../utils/create-floors-from-bus-seats';

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
  const {
    data: busSeatConfiguration,
    isLoading: isLoadingBusSeatConfiguration,
  } = useQueryBusSeatConfiguration({
    seatDiagramId: data?.seatDiagramId ?? 0,
    enabled: !!data?.seatDiagramId && isValidId,
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
    onSuccess: async (data) => {
      await assignDrivers.mutateWithToast({
        busId: data.bus.id,
        driverIds: data.driverIds ?? [],
      });
      await assignTechnologies.mutateWithToast({
        busId: data.bus.id,
        technologyIds: data.technologyIds ?? [],
      });
      queryClient.invalidateQueries({ queryKey: ['buses'] });
    },
  });

  const updateBusSeatConfiguration = useUpdateBusSeatConfiguration();

  const onSubmit = async (values: BusFormValues) => {
    const data = await updateBusWithToast.mutateWithToast(values);
    await updateBusSeatConfiguration.mutateWithToast({
      seatDiagramId: data.bus.seatDiagramId,
      seats: values.seatConfiguration.flatMap((floor) =>
        floor.spaces.map((space) => {
          // Only include reclinementAngle for seat type spaces
          if (
            space.spaceType === SpaceType.SEAT &&
            'reclinementAngle' in space
          ) {
            return {
              ...space,
              reclinementAngle: space.reclinementAngle || undefined,
            };
          }
          return space;
        }),
      ),
    });
    router.push(routes.buses.getDetailsRoute(data.bus.id.toString()));
    return data;
  };

  if (
    isLoading ||
    isNextValidStatusesLoading ||
    isLoadingTechnologies ||
    isLoadingBusSeatConfiguration
  ) {
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
          seatDiagramModelId: 0,
          driverIds: data.busCrew?.map((driver) => driver.driverId) ?? [],
          technologyIds: technologies?.map((technology) => technology.id) ?? [],
          seatConfiguration: createFloorsFromBusSeats(
            busSeatConfiguration?.data ?? [],
          ).map((floor) => ({
            ...floor,
            spaces: floor.spaces.map(convertBusSeatToSeatDiagramSpace),
          })),
        }}
        onSubmit={onSubmit}
        nextValidStatuses={nextValidStatuses?.data}
      />
    </div>
  );
}
