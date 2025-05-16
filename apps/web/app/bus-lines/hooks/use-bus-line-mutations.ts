import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { bus_lines } from '@repo/ims-client';
import { useToastMutation } from '@/hooks/use-toast-mutation';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default function useBusLineMutations() {
  const t = useTranslations('busLines');
  const router = useRouter();
  const queryClient = useQueryClient();

  const invalidateBusLines = () => {
    queryClient.invalidateQueries({ queryKey: ['busLines'] });
  };

  const createMessages = {
    loading: t('messages.create.loading'),
    success: t('messages.create.success'),
    error: t('messages.create.error'),
  };

  const createBusLineMutation = useMutation({
    mutationFn: (payload: bus_lines.CreateBusLinePayload) =>
      imsClient.inventory.createBusLine(payload),
  });

  const createBusLine = useToastMutation({
    mutation: createBusLineMutation,
    messages: createMessages,
    onSuccess: (data: bus_lines.BusLine) => {
      invalidateBusLines();
      router.push(routes.busLines.getDetailsRoute(data.id.toString()));
    },
  });

  const deleteBusLineMutation = useMutation({
    mutationFn: (id: number) => imsClient.inventory.deleteBusLine(id),
  });

  const deleteMessages = {
    loading: t('messages.delete.loading'),
    success: t('messages.delete.success'),
    error: t('messages.delete.error'),
  };

  const deleteBusLine = useToastMutation({
    mutation: deleteBusLineMutation,
    messages: deleteMessages,
    onSuccess: () => {
      invalidateBusLines();
      router.push(routes.busLines.index);
    },
  });

  const updateBusLineMutation = useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: number;
      values: bus_lines.CreateBusLinePayload;
    }) => imsClient.inventory.updateBusLine(id, values),
  });

  const updateMessages = {
    loading: t('messages.update.loading'),
    success: t('messages.update.success'),
    error: t('messages.update.error'),
  };

  const updateBusLine = useToastMutation({
    mutation: updateBusLineMutation,
    messages: updateMessages,
    onSuccess: (data: bus_lines.BusLine) => {
      invalidateBusLines();
      router.push(routes.busLines.getDetailsRoute(data.id.toString()));
    },
  });

  return { createBusLine, deleteBusLine, updateBusLine };
}
