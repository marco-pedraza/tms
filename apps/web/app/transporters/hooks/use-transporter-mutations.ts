import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { transporters } from '@repo/ims-client';
import { useToastMutation } from '@/hooks/use-toast-mutation';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default function useTransporterMutations() {
  const t = useTranslations('transporters');
  const router = useRouter();
  const queryClient = useQueryClient();

  const invalidateTransporters = () => {
    queryClient.invalidateQueries({ queryKey: ['transporters'] });
  };

  const createMessages = {
    loading: t('messages.create.loading'),
    success: t('messages.create.success'),
    error: t('messages.create.error'),
  };

  const createTransporterMutation = useMutation({
    mutationFn: (payload: transporters.CreateTransporterPayload) =>
      imsClient.inventory.createTransporter(payload),
  });

  const createTransporter = useToastMutation({
    mutation: createTransporterMutation,
    messages: createMessages,
    onSuccess: (data: transporters.Transporter) => {
      invalidateTransporters();
      router.push(routes.transporters.getDetailsRoute(data.id.toString()));
    },
  });

  const deleteTransporterMutation = useMutation({
    mutationFn: (id: number) => imsClient.inventory.deleteTransporter(id),
  });

  const deleteMessages = {
    loading: t('messages.delete.loading'),
    success: t('messages.delete.success'),
    error: t('messages.delete.error'),
  };

  const deleteTransporter = useToastMutation({
    mutation: deleteTransporterMutation,
    messages: deleteMessages,
    onSuccess: () => {
      invalidateTransporters();
      router.push(routes.transporters.index);
    },
  });

  const updateTransporterMutation = useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: number;
      values: transporters.CreateTransporterPayload;
    }) => imsClient.inventory.updateTransporter(id, values),
  });

  const updateMessages = {
    loading: t('messages.update.loading'),
    success: t('messages.update.success'),
    error: t('messages.update.error'),
  };

  const updateTransporter = useToastMutation({
    mutation: updateTransporterMutation,
    messages: updateMessages,
    onSuccess: (data: transporters.Transporter) => {
      invalidateTransporters();
      router.push(routes.transporters.getDetailsRoute(data.id.toString()));
    },
  });

  return { createTransporter, deleteTransporter, updateTransporter };
}
