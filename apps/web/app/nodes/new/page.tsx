'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import NodeForm from '@/nodes/components/node-form';
import useNodeMutations from '@/nodes/hooks/use-node-mutations';
import routes from '@/services/routes';

export default function NewNodePage() {
  const { create: createNode } = useNodeMutations();
  const tNodes = useTranslations('nodes');

  return (
    <div>
      <PageHeader
        title={tNodes('actions.create')}
        description={tNodes('description')}
        backHref={routes.nodes.index}
        backLabel={tNodes('actions.backToList')}
      />

      <NodeForm onSubmit={createNode.mutateWithToast} />
    </div>
  );
}
