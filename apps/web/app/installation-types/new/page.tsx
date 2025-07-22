'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { installation_types } from '@repo/ims-client';
import PageHeader from '@/components/page-header';
import { useToastMutation } from '@/hooks/use-toast-mutation';
import InstallationTypeForm from '@/installation-types/components/installation-type-form';
import type { InstallationTypeFormValues } from '@/installation-types/components/installation-type-form';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default function NewInstallationTypePage() {
  const tInstallationTypes = useTranslations('installationTypes');
  const syncInstallationSchemasMutation = useMutation({
    mutationFn: async (params: {
      installationTypeId: number;
      schemas: installation_types.SyncInstallationSchemaPayload[];
    }) => {
      const schemas = await imsClient.inventory.syncInstallationSchemas(
        params.installationTypeId,
        { schemas: params.schemas },
      );
      return {
        installationTypeId: params.installationTypeId,
        schemas: schemas,
      };
    },
  });
  const router = useRouter();
  const syncInstallationSchemas = useToastMutation({
    mutation: syncInstallationSchemasMutation,
    messages: {
      loading: tInstallationTypes('messages.syncInstallationSchemas.loading'),
      success: tInstallationTypes('messages.syncInstallationSchemas.success'),
      error: tInstallationTypes('messages.syncInstallationSchemas.error'),
    },
    onSuccess: (data) => {
      router.push(
        routes.installationTypes.getDetailsRoute(
          data.installationTypeId.toString(),
        ),
      );
    },
    onError: (_, params) => {
      router.push(
        routes.installationTypes.getDetailsRoute(
          params.installationTypeId.toString(),
        ),
      );
    },
  });
  const queryClient = useQueryClient();
  const createInstallationTypeMutation = useMutation({
    mutationFn: async (values: InstallationTypeFormValues) => {
      const installationType =
        await imsClient.inventory.createInstallationType(values);
      return {
        installationType,
        schemas: values.schemas,
      };
    },
  });
  const createInstallationType = useToastMutation({
    mutation: createInstallationTypeMutation,
    messages: {
      loading: tInstallationTypes('messages.create.loading'),
      success: tInstallationTypes('messages.create.success'),
      error: tInstallationTypes('messages.create.error'),
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['installationTypes'] });
      syncInstallationSchemas.mutateWithToast({
        installationTypeId: data.installationType.id,
        schemas: data.schemas.map((schema) => ({
          ...schema,
          name: schema.label.toLowerCase().replace(/ /g, '_'),
          installationTypeId: data.installationType.id,
        })),
      });
    },
  });

  return (
    <div>
      <PageHeader
        title={tInstallationTypes('actions.create')}
        description={tInstallationTypes('description')}
        backHref={routes.installationTypes.index}
        backLabel={tInstallationTypes('actions.backToList')}
      />

      <InstallationTypeForm onSubmit={createInstallationType.mutateWithToast} />
    </div>
  );
}
