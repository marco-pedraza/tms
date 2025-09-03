'use client';

import { useTranslations } from 'next-intl';
import ActionButtons from '@/components/action-buttons';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import routes from '@/services/routes';
import TechnologySkeleton from '@/technologies/components/technology-skeleton';
import useQueryTechnology from '@/technologies/hooks/use-query-technology';
import useTechnologyMutations from '@/technologies/hooks/use-technology-mutations';

export default function TechnologyDetailsPage() {
  const tTechnologies = useTranslations('technologies');
  const tCommon = useTranslations('common');
  const { itemId: technologyId, isValidId } = useCollectionItemDetailsParams();
  const { data: technology, isLoading } = useQueryTechnology({
    itemId: technologyId,
    enabled: isValidId,
  });
  const { delete: deleteTechnology } = useTechnologyMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deleteTechnology.mutateWithToast,
    });

  const onDelete = () => {
    if (!technologyId) return;
    setDeleteId(technologyId);
  };

  if (isLoading) {
    return <TechnologySkeleton />;
  }

  if (!technology) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={technology.name}
        description={tTechnologies('details.description')}
        backHref={routes.technologies.index}
      />

      <div className="flex justify-end mb-6">
        <ActionButtons
          editHref={routes.technologies.getEditRoute(technology.id.toString())}
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
                <dt className="font-medium">{tTechnologies('fields.name')}:</dt>
                <dd>{technology.name || '-'}</dd>

                <dt className="font-medium">
                  {tTechnologies('fields.description')}:
                </dt>
                <dd>{technology.description || '-'}</dd>

                <dt className="font-medium">
                  {tTechnologies('fields.provider')}:
                </dt>
                <dd>{technology.provider || '-'}</dd>

                <dt className="font-medium">
                  {tTechnologies('fields.version')}:
                </dt>
                <dd>{technology.version || '-'}</dd>

                <dt className="font-medium">{tCommon('fields.status')}:</dt>
                <dd>
                  {technology.active ? (
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
                <dd>{technology.id}</dd>

                <dt className="font-medium">{tCommon('fields.createdAt')}:</dt>
                <dd>
                  {technology.createdAt
                    ? new Date(technology.createdAt).toLocaleString()
                    : '-'}
                </dd>

                <dt className="font-medium">{tCommon('fields.updatedAt')}:</dt>
                <dd>
                  {technology.updatedAt
                    ? new Date(technology.updatedAt).toLocaleString()
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
