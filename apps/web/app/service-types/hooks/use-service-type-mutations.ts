import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { service_types } from '@repo/ims-client';
import { useToastMutation } from '@/hooks/use-toast-mutation';
import imsClient from '@/services/ims-client';

export default function useServiceTypeMutations() {
  const t = useTranslations('serviceTypes');
  const router = useRouter();
  const queryClient = useQueryClient();

  const invalidateServiceTypes = () => {
    queryClient.invalidateQueries({ queryKey: ['serviceTypes'] });
  };

  const createMessages = {
    loading: t('messages.create.loading'),
    success: t('messages.create.success'),
    error: t('messages.create.error'),
  };

  const createServiceTypeMutation = useMutation({
    mutationFn: (payload: service_types.CreateServiceTypePayload) =>
      imsClient.inventory.createServiceType(payload),
  });

  const createServiceType = useToastMutation({
    mutation: createServiceTypeMutation,
    messages: createMessages,
    onSuccess: (data: service_types.ServiceType) => {
      invalidateServiceTypes();
      router.push(`/service-types/${data.id}`);
    },
  });

  const deleteServiceTypeMutation = useMutation({
    mutationFn: (id: number) => imsClient.inventory.deleteServiceType(id),
  });

  const deleteMessages = {
    loading: t('messages.delete.loading'),
    success: t('messages.delete.success'),
    error: t('messages.delete.error'),
  };

  const deleteServiceType = useToastMutation({
    mutation: deleteServiceTypeMutation,
    messages: deleteMessages,
    onSuccess: () => {
      invalidateServiceTypes();
      router.push('/service-types');
    },
  });

  const updateServiceTypeMutation = useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: number;
      values: service_types.CreateServiceTypePayload;
    }) => imsClient.inventory.updateServiceType(id, values),
  });

  const updateMessages = {
    loading: t('messages.update.loading'),
    success: t('messages.update.success'),
    error: t('messages.update.error'),
  };

  const updateServiceType = useToastMutation({
    mutation: updateServiceTypeMutation,
    messages: updateMessages,
    onSuccess: (data: service_types.ServiceType) => {
      invalidateServiceTypes();
      router.push(`/service-types/${data.id}`);
    },
  });

  return { createServiceType, deleteServiceType, updateServiceType };
}
