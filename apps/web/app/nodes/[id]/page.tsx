'use client';

import { ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import ActionButtons from '@/components/action-buttons';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import NodeSkeleton from '@/nodes/components/node-skeleton';
import useNodeDetailsParams from '@/nodes/hooks/use-node-details-params';
import useNodeMutations from '@/nodes/hooks/use-node-mutations';
import useQueryNode from '@/nodes/hooks/use-query-node';
import routes from '@/services/routes';
import createGoogleMapsLink from '@/utils/create-google-maps-link';

export default function NodeDetailsPage() {
  const tNodes = useTranslations('nodes');
  const tCommon = useTranslations('common');
  const { nodeId, isValidId } = useNodeDetailsParams();
  const { data: node, isLoading } = useQueryNode({
    nodeId,
    enabled: isValidId,
  });
  const { delete: deleteNode } = useNodeMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deleteNode.mutateWithToast,
    });

  const onDelete = () => {
    if (!node) return;
    setDeleteId(node.id);
  };

  if (isLoading) {
    return <NodeSkeleton />;
  }

  if (!node) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={node.name}
        description={tNodes('details.description')}
        backHref={routes.nodes.index}
      />

      <div className="flex justify-end mb-6">
        <ActionButtons
          editHref={routes.nodes.getEditRoute(node.id.toString())}
          onDelete={onDelete}
          editLabel={tCommon('actions.edit')}
          deleteLabel={tCommon('actions.delete')}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{tCommon('sections.basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{tCommon('fields.name')}:</dt>
              <dd>{node.name}</dd>

              <dt className="font-medium">{tCommon('fields.code')}:</dt>
              <dd>{node.code}</dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tCommon('sections.location')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{tNodes('fields.city')}:</dt>
              <dd>{node.city.name}</dd>

              <dt className="font-medium">{tCommon('fields.coordinates')}:</dt>
              <dd>
                <a
                  href={createGoogleMapsLink(node.latitude, node.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-primary"
                >
                  {node.latitude}, {node.longitude}
                  <ExternalLink className="ml-1 h-4 w-4" />
                </a>
              </dd>
            </dl>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{tCommon('sections.systemInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4 md:grid-cols-[1fr_2fr_1fr_2fr]">
              <dt className="font-medium">{tCommon('fields.id')}:</dt>
              <dd>{node.id}</dd>

              <dt className="font-medium">{tCommon('fields.createdAt')}:</dt>
              <dd>
                {node.createdAt
                  ? new Date(node.createdAt).toLocaleString()
                  : '-'}
              </dd>

              <dt className="font-medium">{tCommon('fields.updatedAt')}:</dt>
              <dd>
                {node.updatedAt
                  ? new Date(node.updatedAt).toLocaleString()
                  : '-'}
              </dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onConfirm={onConfirmDelete}
        onOpenChange={onCancelDelete}
      />
    </div>
  );
}
