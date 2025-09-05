'use client';

import { useTranslations } from 'next-intl';
import ChromaticSkeleton from '@/chromatics/components/chromatic-skeleton';
import useChromaticMutations from '@/chromatics/hooks/use-chromatic-mutations';
import useQueryChromatic from '@/chromatics/hooks/use-query-chromatic';
import ActionButtons from '@/components/action-buttons';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import routes from '@/services/routes';

export default function ChromaticDetailsPage() {
  const tChromatics = useTranslations('chromatics');
  const tCommon = useTranslations('common');
  const { itemId: chromaticId, isValidId } = useCollectionItemDetailsParams();
  const { data: chromatic, isLoading } = useQueryChromatic({
    itemId: chromaticId,
    enabled: isValidId,
  });
  const { delete: deleteChromatic } = useChromaticMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deleteChromatic.mutateWithToast,
    });

  const onDelete = () => {
    if (!chromaticId) return;
    setDeleteId(chromaticId);
  };

  if (isLoading) {
    return <ChromaticSkeleton />;
  }

  if (!chromatic) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={chromatic.name}
        description={tChromatics('details.description')}
        backHref={routes.chromatics.index}
      />

      <div className="flex justify-end mb-6">
        <ActionButtons
          editHref={routes.chromatics.getEditRoute(chromatic.id.toString())}
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
                <dt className="font-medium">{tChromatics('fields.name')}:</dt>
                <dd>{chromatic.name || '-'}</dd>

                <dt className="font-medium">
                  {tChromatics('fields.imageUrl')}:
                </dt>
                <dd>{chromatic.imageUrl || '-'}</dd>

                <dt className="font-medium">
                  {tChromatics('fields.description')}:
                </dt>
                <dd>{chromatic.description || '-'}</dd>

                <dt className="font-medium">{tCommon('fields.status')}:</dt>
                <dd>
                  {chromatic.active ? (
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
                <dd>{chromatic.id}</dd>

                <dt className="font-medium">{tCommon('fields.createdAt')}:</dt>
                <dd>
                  {chromatic.createdAt
                    ? new Date(chromatic.createdAt).toLocaleString()
                    : '-'}
                </dd>

                <dt className="font-medium">{tCommon('fields.updatedAt')}:</dt>
                <dd>
                  {chromatic.updatedAt
                    ? new Date(chromatic.updatedAt).toLocaleString()
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
