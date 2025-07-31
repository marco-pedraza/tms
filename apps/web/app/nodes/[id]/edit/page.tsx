'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import PageHeader from '@/components/page-header';
import { NodeFormOutputValues } from '@/nodes/components/node-form';
import NodeForm from '@/nodes/components/node-form';
import NodeFormSkeleton from '@/nodes/components/node-form-skeleton';
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
          onSuccess: () => {
            router.push(routes.nodes.getDetailsRoute(nodeId.toString()));
          },
          onError: () => {
            toast.info(tNodes('messages.syncIntallationError.update'));
          },
        },
      );
    } else {
      if (values.installationTypeId) {
        await createInstallation.mutateWithToast(
          { nodeId: nodeId, ...values },
          {
            standalone: false,
            onSuccess: () => {
              router.push(routes.nodes.getDetailsRoute(nodeId.toString()));
            },
            onError: () => {
              toast.info(tNodes('messages.syncIntallationError.create'));
            },
          },
        );
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
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
