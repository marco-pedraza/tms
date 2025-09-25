'use client';

import { useTranslations } from 'next-intl';
import ActionButtons from '@/components/action-buttons';
import AffirmationBadge from '@/components/affirmation-badge';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import IsEmptyTripBadge from '@/components/is-empty-trip-badge';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import PathwaySkeleton from '@/pathways/components/pathway-skeleton';
import useQueryPathway from '@/pathways/hooks/use-query-pathway';
import routes from '@/services/routes';
import usePathwayMutations from '../hooks/use-pathway-mutations';

export default function PathwayDetailsPage() {
  const tPathways = useTranslations('pathways');
  const tCommon = useTranslations('common');
  const { itemId: pathwayId, isValidId } = useCollectionItemDetailsParams();
  const { data: pathway, isLoading } = useQueryPathway({
    itemId: pathwayId,
    enabled: isValidId,
  });
  const { delete: deletePathway } = usePathwayMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deletePathway.mutateWithToast,
    });

  const onDelete = () => {
    if (!pathwayId) return;
    setDeleteId(pathwayId);
  };

  if (isLoading) {
    return <PathwaySkeleton />;
  }

  if (!pathway) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={pathway.name}
        description={tPathways('details.description')}
        backHref={routes.pathways.index}
      />

      <div className="flex justify-end mb-6">
        <ActionButtons
          editHref={routes.pathways.getEditRoute(pathway.id.toString())}
          onDelete={onDelete}
          editLabel={tCommon('actions.edit')}
          deleteLabel={tCommon('actions.delete')}
        />
      </div>

      <div className="max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{tCommon('sections.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[1fr_2fr] gap-4">
                <dt className="font-medium">{tPathways('fields.code')}:</dt>
                <dd>{pathway.code || '-'}</dd>

                <dt className="font-medium">{tPathways('fields.name')}:</dt>
                <dd>{pathway.name || '-'}</dd>

                <dt className="font-medium">
                  {tPathways('fields.description')}:
                </dt>
                <dd>{pathway.description || '-'}</dd>

                <dt className="font-medium">
                  {tPathways('fields.isEmptyTrip')}:
                </dt>
                <dd>
                  <IsEmptyTripBadge isEmptyTrip={pathway.isEmptyTrip} />
                </dd>

                <dt className="font-medium">
                  {tPathways('fields.isSellable')}:
                </dt>
                <dd>
                  <AffirmationBadge value={pathway.isSellable} />
                </dd>

                <dt className="font-medium">{tCommon('fields.status')}:</dt>
                <dd>
                  {pathway.active ? (
                    <Badge variant="outline" className="bg-green-100">
                      {tCommon('status.active')}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-100">
                      {tCommon('status.inactive')}
                    </Badge>
                  )}
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
                <dd>{pathway.id}</dd>

                <dt className="font-medium">{tCommon('fields.createdAt')}:</dt>
                <dd>
                  {pathway.createdAt
                    ? new Date(pathway.createdAt).toLocaleString()
                    : '-'}
                </dd>

                <dt className="font-medium">{tCommon('fields.updatedAt')}:</dt>
                <dd>
                  {pathway.updatedAt
                    ? new Date(pathway.updatedAt).toLocaleString()
                    : '-'}
                </dd>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}
