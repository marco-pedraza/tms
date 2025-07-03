'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import { NodeFormValues } from '@/nodes/components/node-form';
import NodeForm from '@/nodes/components/node-form';
import NodeFormSkeleton from '@/nodes/components/node-form-skeleton';
import useNodeDetailsParams from '@/nodes/hooks/use-node-details-params';
import useNodeMutations from '@/nodes/hooks/use-node-mutations';
import useQueryNode from '@/nodes/hooks/use-query-node';
import routes from '@/services/routes';

export default function EditNodePage() {
  const tNodes = useTranslations('nodes');
  const { nodeId, isValidId } = useNodeDetailsParams();
  const { data, isLoading } = useQueryNode({
    nodeId,
    enabled: isValidId,
  });
  const { update: updateNode } = useNodeMutations();

  const handleSubmit = (values: NodeFormValues) => {
    return updateNode.mutateWithToast({ id: nodeId, values });
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
      <NodeForm defaultValues={data} onSubmit={handleSubmit} />
    </div>
  );
}
