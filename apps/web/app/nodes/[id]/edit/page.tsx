'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import PageHeader from '@/components/page-header';
import { NodeFormOutputValues } from '@/nodes/components/node-form';
import NodeForm from '@/nodes/components/node-form';
import NodeFormSkeleton from '@/nodes/components/node-form-skeleton';
import useInstallationAmenityMutations from '@/nodes/hooks/use-installation-amenity-mutations';
import useInstallationMutations from '@/nodes/hooks/use-installation-mutations';
import useNodeDetailsParams from '@/nodes/hooks/use-node-details-params';
import useNodeLabelMutations from '@/nodes/hooks/use-node-label-mutations';
import useNodeMutations from '@/nodes/hooks/use-node-mutations';
import useQueryInstallation from '@/nodes/hooks/use-query-installation';
import useQueryNode from '@/nodes/hooks/use-query-node';
import useUpdateInstallationPropertiesMutation from '@/nodes/hooks/use-update-installation-properties-mutation';
import routes from '@/services/routes';
import { InstallationSchemaFieldType } from '@/types/installation-schemas';

export default function EditNodePage() {
  const tNodes = useTranslations('nodes');
  const { nodeId, isValidId } = useNodeDetailsParams();
  const router = useRouter();
  const { data, isLoading } = useQueryNode({
    nodeId,
    enabled: isValidId,
  });
  const { update: updateNode } = useNodeMutations();
  const { create: createInstallation, update: updateInstallation } =
    useInstallationMutations();
  const updateProperties = useUpdateInstallationPropertiesMutation();
  const { data: installation, isLoading: isLoadingInstallation } =
    useQueryInstallation({
      installationId: data?.installation?.id || 0,
      enabled: !!data?.installation?.id,
    });
  const { assignLabels } = useNodeLabelMutations();
  const { assignAmenities } = useInstallationAmenityMutations();

  const handleSubmit = async (values: NodeFormOutputValues) => {
    let installationId = data?.installation?.id;
    const updatedNode = await updateNode.mutateWithToast(
      {
        id: nodeId,
        values,
      },
      {
        standalone: false,
      },
    );

    // Update label assignment (this replaces all existing labels)
    await assignLabels.mutateWithToast(
      {
        nodeId: nodeId,
        labelIds: values.labelIds || [],
      },
      {
        standalone: false,
      },
    );

    if (data?.installation?.id) {
      await updateInstallation.mutateWithToast(
        {
          id: data.installation.id,
          values,
        },
        {
          standalone: false,
          onError: () => {
            toast.info(tNodes('messages.syncIntallationError.update'));
          },
        },
      );
    } else {
      if (values.installationTypeId) {
        const newInstallation = await createInstallation.mutateWithToast(
          { nodeId: nodeId, ...values },
          {
            standalone: false,
            onError: () => {
              toast.info(tNodes('messages.syncIntallationError.create'));
            },
          },
        );
        installationId = newInstallation.id;
      }
    }

    if (installationId) {
      await assignAmenities.mutateWithToast(
        {
          installationId,
          amenityIds: values.amenityIds || [],
        },
        {
          standalone: false,
        },
      );
    }

    if (installationId && values.customAttributes) {
      await updateProperties.mutateWithToast(
        {
          id: installationId,
          properties: Object.entries(values.customAttributes).map(
            ([key, value]) => ({
              name: key,
              value: String(value),
            }),
          ),
        },
        {
          standalone: false,
          onError: () => {
            toast.info(tNodes('messages.syncCustomAttributesError'));
          },
        },
      );
    }

    router.push(routes.nodes.getDetailsRoute(nodeId.toString()));
    return updatedNode;
  };

  if (isLoading || isLoadingInstallation) {
    return <NodeFormSkeleton />;
  }

  if (!data) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={tNodes('edit.title')}
        description={data.name}
        backHref={routes.nodes.index}
      />
      <NodeForm
        defaultValues={{
          ...data,
          installationTypeId: data.installation?.installationTypeId,
          address: data.installation?.address || '',
          description: data.installation?.description || '',
          contactPhone: data.installation?.contactPhone || '',
          contactEmail: data.installation?.contactEmail || '',
          website: data.installation?.website || '',
          customAttributes: installation?.properties?.map((property) => ({
            name: property.name,
            value: property.value
              ? typeof property.value === 'boolean'
                ? property.value
                : String(property.value)
              : property.type === InstallationSchemaFieldType.BOOLEAN
                ? false
                : '',
          })),
          labelIds: data.labels?.map((label) => label.id) || [],
          amenityIds:
            data.installation?.amenities?.map((amenity) => amenity.id) || [],
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
