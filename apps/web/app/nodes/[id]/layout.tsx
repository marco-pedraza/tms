'use client';

import { useTranslations } from 'next-intl';
import LoadError from '@/components/load-error';
import NodeNotFound from '@/nodes/components/node-not-found';
import useNodeDetailsParams from '@/nodes/hooks/use-node-details-params';
import useQueryNode from '@/nodes/hooks/use-query-node';
import routes from '@/services/routes';

/**
 * Layout component for node detail pages
 *
 * Handles common error states and resource not found cases,
 * while allowing children to handle their own loading states
 */
export default function NodeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tNodes = useTranslations('nodes');
  const { nodeId, isValidId } = useNodeDetailsParams();
  const { status, error } = useQueryNode({
    nodeId,
    enabled: isValidId,
  });
  const isNodeNotFound = !isValidId || error?.code === 'not_found';

  if (isNodeNotFound) {
    return <NodeNotFound />;
  }

  if (status === 'error') {
    return (
      <LoadError
        backHref={routes.nodes.index}
        backLabel={tNodes('actions.backToList')}
      />
    );
  }

  return children;
}
