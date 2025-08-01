import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { installation_properties } from '@repo/ims-client';
import { useToastMutation } from '@/hooks/use-toast-mutation';
import imsClient from '@/services/ims-client';

export default function useUpdateInstallationPropertiesMutation() {
  const tNodes = useTranslations('nodes');
  const updatePropertiesMutation = useMutation({
    mutationFn: ({
      id,
      properties,
    }: {
      id: number;
      properties: installation_properties.PropertyInput[];
    }) =>
      imsClient.inventory.updateInstallationProperties(id, {
        properties,
      }),
  });
  return useToastMutation({
    mutation: updatePropertiesMutation,
    messages: {
      loading: tNodes('messages.syncCustomAttributes.loading'),
      success: tNodes('messages.syncCustomAttributes.success'),
      error: tNodes('messages.syncCustomAttributes.error'),
    },
  });
}
