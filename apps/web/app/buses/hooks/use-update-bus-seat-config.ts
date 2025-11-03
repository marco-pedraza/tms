import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { bus_seats } from '@repo/ims-client';
import { useToastMutation } from '@/hooks/use-toast-mutation';
import imsClient from '@/services/ims-client';

interface UpdateBusSeatConfigPayload {
  seatDiagramId: number;
  seats: bus_seats.SeatConfigurationInput[];
}

/**
 * Custom hook for updating seat configuration for a specific bus.
 *
 * This hook updates the actual bus seats (not seat models) for a specific
 * seat diagram instance, marking the diagram as modified.
 */
export default function useUpdateBusSeatConfiguration() {
  const tBuses = useTranslations('buses');

  const updateBusSeatConfigMutation = useMutation<
    bus_seats.UpdatedSeatConfiguration,
    Error,
    UpdateBusSeatConfigPayload
  >({
    mutationFn: (payload: UpdateBusSeatConfigPayload) =>
      imsClient.inventory.updateSeatDiagramConfiguration(
        payload.seatDiagramId,
        {
          seats: payload.seats,
        },
      ),
  });

  const updateBusSeatConfigurationWithToast = useToastMutation({
    mutation: updateBusSeatConfigMutation,
    messages: {
      loading: tBuses('messages.updateBusSeatConfiguration.loading'),
      success: tBuses('messages.updateBusSeatConfiguration.success'),
      error: tBuses('messages.updateBusSeatConfiguration.error'),
    },
  });

  return updateBusSeatConfigurationWithToast;
}
