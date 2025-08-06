'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { installation_schemas, installation_types } from '@repo/ims-client';
import PageHeader from '@/components/page-header';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import { useToastMutation } from '@/hooks/use-toast-mutation';
import InstallationTypeForm from '@/installation-types/components/installation-type-form';
import { InstallationTypeFormValues } from '@/installation-types/components/installation-type-form';
import InstallationTypeFormSkeleton from '@/installation-types/components/installation-type-form-skeleton';
import useQueryInstallationType from '@/installation-types/hooks/use-query-installation-type';
import useQueryInstallationTypeEvents from '@/installation-types/hooks/use-query-installation-type-events';
import useQueryInstallationTypeSchemas from '@/installation-types/hooks/use-query-installation-type-schemas';
import imsClient from '@/services/ims-client';
import routes from '@/services/routes';

export default function EditInstallationTypePage() {
  const tInstallationTypes = useTranslations('installationTypes');
  const { itemId: installationTypeId, isValidId } =
    useCollectionItemDetailsParams();
  const { data, isLoading } = useQueryInstallationType({
    itemId: installationTypeId,
    enabled: isValidId,
  });

  const { data: events } = useQueryInstallationTypeEvents({
    installationTypeId,
    enabled: isValidId,
  });

  const { data: schemas, isLoading: isSchemasLoading } =
    useQueryInstallationTypeSchemas({
      installationTypeId,
      enabled: isValidId,
    });
  const router = useRouter();
  const syncInstallationSchemasMutation = useMutation({
    mutationFn: (values: installation_types.SyncInstallationSchemaPayload[]) =>
      imsClient.inventory.syncInstallationSchemas(installationTypeId, {
        schemas: values,
      }),
  });
  const syncInstallationSchemas = useToastMutation({
    mutation: syncInstallationSchemasMutation,
    messages: {
      loading: tInstallationTypes('messages.syncInstallationSchemas.loading'),
      success: tInstallationTypes('messages.syncInstallationSchemas.success'),
      error: tInstallationTypes('messages.syncInstallationSchemas.error'),
    },
    onSuccess: () => {
      router.push(
        routes.installationTypes.getDetailsRoute(installationTypeId.toString()),
      );
    },
    onError: () => {
      router.push(
        routes.installationTypes.getDetailsRoute(installationTypeId.toString()),
      );
    },
  });
  const queryClient = useQueryClient();

  const assignEventTypesMutation = useMutation({
    mutationKey: ['installationTypes', 'assignEventTypes'],
    mutationFn: async (payload: { eventTypeIds: number[] }) =>
      await imsClient.inventory.assignEventTypesToInstallationType(
        installationTypeId,
        { eventTypeIds: payload.eventTypeIds },
      ),
  });

  const assignEventTypes = useToastMutation({
    mutation: assignEventTypesMutation,
    messages: {
      loading: tInstallationTypes('messages.assignEventTypes.loading'),
      success: tInstallationTypes('messages.assignEventTypes.success'),
      error: tInstallationTypes('messages.assignEventTypes.error'),
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['installationType', installationTypeId, 'events'],
      });
    },
  });

  const updateInstallationTypeMutation = useMutation({
    mutationFn: async (values: InstallationTypeFormValues) => {
      const installationType = await imsClient.inventory.updateInstallationType(
        installationTypeId,
        values,
      );
      return {
        installationType,
        schemas: values.schemas,
        eventTypeIds: values.eventTypeIds,
      };
    },
  });

  const updateInstallationType = useToastMutation({
    mutation: updateInstallationTypeMutation,
    messages: {
      loading: tInstallationTypes('messages.update.loading'),
      success: tInstallationTypes('messages.update.success'),
      error: tInstallationTypes('messages.update.error'),
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['installationTypes'] });
      syncInstallationSchemas.mutateWithToast(
        data.schemas.map((schema) => ({
          ...schema,
          installationTypeId: data.installationType.id,
        })),
      );
      assignEventTypes.mutateWithToast({
        eventTypeIds: data.eventTypeIds ?? [],
      });
    },
  });

  if (isLoading || isSchemasLoading) {
    return <InstallationTypeFormSkeleton />;
  }

  if (!data) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={tInstallationTypes('edit.title')}
        description={data.name}
        backHref={routes.installationTypes.index}
      />
      <InstallationTypeForm
        defaultValues={{
          ...data,
          description: data.description ?? undefined,
          schemas:
            schemas?.data.map(
              (schema: installation_schemas.InstallationSchema) => ({
                ...schema,
                description: schema.description ?? '',
                options: {
                  enumValues: schema.options.enumValues ?? [],
                },
              }),
            ) ?? [],
          eventTypeIds: events?.map((event) => event.id) ?? [],
        }}
        onSubmit={updateInstallationType.mutateWithToast}
      />
    </div>
  );
}
