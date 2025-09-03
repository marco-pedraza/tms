import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { bus_seat_models } from '@repo/ims-client';
import { useToastMutation } from '@/hooks/use-toast-mutation';
import imsClient from '@/services/ims-client';

interface UpdateSeatConfigPayload {
  seatDiagramId: number;
  seats: bus_seat_models.SeatConfigurationInput[];
}

export default function useUpdateSeatConfigMutation() {
  const tSeatDiagrams = useTranslations('seatDiagrams');

  const updateSeatConfigMutation = useMutation({
    mutationFn: (payload: UpdateSeatConfigPayload) =>
      imsClient.inventory.updateSeatConfiguration(payload.seatDiagramId, {
        seats: payload.seats,
      }),
  });

  const updateSeatConfigurationWithToast = useToastMutation({
    mutation: updateSeatConfigMutation,
    messages: {
      loading: tSeatDiagrams('messages.updateSeatConfiguration.loading'),
      success: tSeatDiagrams('messages.updateSeatConfiguration.success'),
      error: tSeatDiagrams('messages.updateSeatConfiguration.error'),
    },
  });

  return updateSeatConfigurationWithToast;
}
