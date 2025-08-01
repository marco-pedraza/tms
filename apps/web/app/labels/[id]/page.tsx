'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import ActionButtons from '@/components/action-buttons';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import IsActiveBadge from '@/components/is-active-badge';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import LabelSkeleton from '@/labels/components/label-skeleton';
import useLabelMutations from '@/labels/hooks/use-label-mutations';
import useQueryLabel from '@/labels/hooks/use-query-label';
import routes from '@/services/routes';

export default function LabelDetailsPage() {
  const tLabels = useTranslations('labels');
  const tCommon = useTranslations('common');
  const { itemId: labelId, isValidId } = useCollectionItemDetailsParams();
  const { data: label, isLoading } = useQueryLabel({
    itemId: labelId,
    enabled: isValidId,
  });
  const { delete: deleteLabel } = useLabelMutations();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteLabel.mutateWithToast(labelId);
    setIsDeleteDialogOpen(false);
  };

  if (isLoading) {
    return <LabelSkeleton />;
  }

  if (!label) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={label.name}
        description={tLabels('details.description')}
        backHref={routes.labels.index}
      />

      <div className="flex justify-end mb-6">
        <ActionButtons
          editHref={routes.labels.getEditRoute(label.id.toString())}
          onDelete={handleDelete}
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
              <dd>{label.name}</dd>

              <dt className="font-medium">{tCommon('fields.description')}:</dt>
              <dd>{label.description}</dd>

              <dt className="font-medium">{tCommon('fields.color')}:</dt>
              <dd className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border border-gray-200"
                  style={{ backgroundColor: label.color }}
                />
                <span className="font-mono text-sm">{label.color}</span>
              </dd>

              <dt className="font-medium">{tCommon('fields.usageCount')}:</dt>
              <dd>
                {label.nodeCount}{' '}
                {label.nodeCount === 1
                  ? tLabels('nodeCount.nodo')
                  : tLabels('nodeCount.nodos')}
              </dd>

              <dt className="font-medium">{tCommon('fields.status')}:</dt>
              <dd>
                <IsActiveBadge isActive={label.active} />
              </dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tCommon('sections.systemInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{tCommon('fields.id')}:</dt>
              <dd>{label.id}</dd>

              <dt className="font-medium">{tCommon('fields.createdAt')}:</dt>
              <dd>
                {label.createdAt
                  ? new Date(label.createdAt).toLocaleString()
                  : '-'}
              </dd>

              <dt className="font-medium">{tCommon('fields.updatedAt')}:</dt>
              <dd>
                {label.updatedAt
                  ? new Date(label.updatedAt).toLocaleString()
                  : '-'}
              </dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
