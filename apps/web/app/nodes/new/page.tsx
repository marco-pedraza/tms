'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import PageHeader from '@/components/page-header';
import NodeForm, { NodeFormOutputValues } from '@/nodes/components/node-form';
import useInstallationMutations from '@/nodes/hooks/use-installation-mutations';
import useNodeLabelMutations from '@/nodes/hooks/use-node-label-mutations';
import useNodeMutations from '@/nodes/hooks/use-node-mutations';
import routes from '@/services/routes';

export default function NewNodePage() {
  const router = useRouter();
  const { create: createNode } = useNodeMutations();
  const { create: createInstallation } = useInstallationMutations();
  const { assignLabels } = useNodeLabelMutations();
  const tNodes = useTranslations('nodes');

  const onSubmit = async (values: NodeFormOutputValues) => {
    const node = await createNode.mutateWithToast(values, {
      standalone: false,
    });

    // Assign labels if any were selected
    if (values.labelIds?.length > 0) {
      await assignLabels.mutateWithToast(
        {
          nodeId: node.id,
          labelIds: values.labelIds,
        },
        {
          standalone: false,
        },
      );
    }

    await createInstallation.mutateWithToast(
      { nodeId: node.id, ...values },
      {
        standalone: false,
        onSuccess: () => {
          router.push(routes.nodes.getDetailsRoute(node.id.toString()));
        },
        onError: () => {
          toast.info(tNodes('messages.syncIntallationError.create'));
          router.push(routes.nodes.getEditRoute(node.id.toString()));
        },
      },
    );
    return node;
  };

  return (
    <div>
      <PageHeader
        title={tNodes('actions.create')}
        description={tNodes('description')}
        backHref={routes.nodes.index}
        backLabel={tNodes('actions.backToList')}
      />
      <NodeForm onSubmit={onSubmit} />
    </div>
  );
}
