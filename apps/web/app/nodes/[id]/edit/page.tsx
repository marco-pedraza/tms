'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import { NodeFormOutputValues } from '@/nodes/components/node-form';
import NodeForm from '@/nodes/components/node-form';
import NodeFormSkeleton from '@/nodes/components/node-form-skeleton';
import useInstallationAmenityMutations from '@/nodes/hooks/use-installation-amenity-mutations';
import useInstallationMutations from '@/nodes/hooks/use-installation-mutations';
import useNodeDetailsParams from '@/nodes/hooks/use-node-details-params';
import useNodeLabelMutations from '@/nodes/hooks/use-node-label-mutations';
import useNodeMutations from '@/nodes/hooks/use-node-mutations';
import useQueryNode from '@/nodes/hooks/use-query-node';
import routes from '@/services/routes';

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
  const { assignLabels } = useNodeLabelMutations();
  const { assignAmenities } = useInstallationAmenityMutations();

  const handleSubmit = async (values: NodeFormOutputValues) => {
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
        },
      );

      await assignAmenities.mutateWithToast(
        {
          installationId: data.installation.id,
          amenityIds: values.amenityIds || [],
        },
        {
          standalone: false,
        },
      );

      router.push(routes.nodes.getDetailsRoute(nodeId.toString()));
    } else {
      if (values.installationTypeId) {
        const createdInstallation = await createInstallation.mutateWithToast(
          { nodeId: nodeId, ...values },
          {
            standalone: false,
          },
        );

        if (createdInstallation?.id) {
          await assignAmenities.mutateWithToast(
            {
              installationId: createdInstallation.id,
              amenityIds: values.amenityIds || [],
            },
            {
              standalone: false,
            },
          );
        }
        router.push(routes.nodes.getDetailsRoute(nodeId.toString()));
      } else {
        router.push(routes.nodes.getDetailsRoute(nodeId.toString()));
      }
    }
    return updatedNode;
  };

  if (isLoading) {
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
          labelIds: data.labels?.map((label) => label.id) || [],
          amenityIds:
            data.installation?.amenities?.map((amenity) => amenity.id) || [],
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
