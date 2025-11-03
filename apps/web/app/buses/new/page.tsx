'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import BusForm, { BusFormValues } from '@/buses/components/bus-form';
import useUpdateBusSeatConfiguration from '@/buses/hooks/use-update-bus-seat-config';
import PageHeader from '@/components/page-header';
import { useToastMutation } from '@/hooks/use-toast-mutation';
import imsClient, { SpaceType } from '@/services/ims-client';
import routes from '@/services/routes';

export default function NewBusPage() {
  const tBuses = useTranslations('buses');
  const router = useRouter();

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

  const createBusMutation = useMutation({
    mutationFn: async (values: BusFormValues) => {
      const bus = await imsClient.inventory.createBus(values);
      return {
        bus,
        technologyIds: values.technologyIds,
        driverIds: values.driverIds,
      };
    },
  });

  const updateBusSeatConfiguration = useUpdateBusSeatConfiguration();

  const createBusWithToast = useToastMutation({
    onSuccess: async (data) => {
      await assignTechnologies.mutateWithToast({
        busId: data.bus.id,
        technologyIds: data.technologyIds ?? [],
      });
      await assignDrivers.mutateWithToast({
        busId: data.bus.id,
        driverIds: data.driverIds ?? [],
      });
    },
    mutation: createBusMutation,
    messages: {
      loading: tBuses('messages.create.loading'),
      success: tBuses('messages.create.success'),
      error: tBuses('messages.create.error'),
    },
  });

  const onSubmit = async (values: BusFormValues) => {
    const data = await createBusWithToast.mutateWithToast(values);
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

  return (
    <div className="w-full max-w-5xl mx-auto">
      <PageHeader
        title={tBuses('actions.create')}
        backHref={routes.buses.index}
        backLabel={tBuses('actions.backToList')}
      />

      <BusForm onSubmit={onSubmit} />
    </div>
  );
}
