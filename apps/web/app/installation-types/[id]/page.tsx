'use client';

import { useTranslations } from 'next-intl';
import ActionButtons from '@/components/action-buttons';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import InstallationTypeSkeleton from '@/installation-types/components/installation-type-skeleton';
import useInstallationTypeMutations from '@/installation-types/hooks/use-installation-type-mutations';
import useQueryInstallationType from '@/installation-types/hooks/use-query-installation-type';
import routes from '@/services/routes';

export default function InstallationTypeDetailsPage() {
  const tInstallationTypes = useTranslations('installationTypes');
  const tCommon = useTranslations('common');
  const { itemId: installationTypeId, isValidId } =
    useCollectionItemDetailsParams();
  const { data: installationType, isLoading } = useQueryInstallationType({
    itemId: installationTypeId,
    enabled: isValidId,
  });
  const { delete: deleteInstallationType } = useInstallationTypeMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deleteInstallationType.mutateWithToast,
    });

  const onDelete = () => {
    if (!installationType) return;
    setDeleteId(installationType.id);
  };

  if (isLoading) {
    return <InstallationTypeSkeleton />;
  }

  if (!installationType) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={installationType.name}
        description={tInstallationTypes('details.description')}
        backHref={routes.installationTypes.index}
      />

      <div className="flex justify-end mb-6">
        <ActionButtons
          editHref={routes.installationTypes.getEditRoute(
            installationType.id.toString(),
          )}
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
              <dd>{installationType.name}</dd>

              <dt className="font-medium">{tCommon('fields.code')}:</dt>
              <dd>{installationType.code}</dd>

              <dt className="font-medium">{tCommon('fields.description')}:</dt>
              <dd>{installationType.description}</dd>

              <dt className="font-medium">{tCommon('fields.status')}:</dt>
              <dd>
                {installationType.active ? (
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
              <dd>{installationType.id}</dd>

              <dt className="font-medium">{tCommon('fields.createdAt')}:</dt>
              <dd>
                {installationType.createdAt
                  ? new Date(installationType.createdAt).toLocaleString()
                  : '-'}
              </dd>

              <dt className="font-medium">{tCommon('fields.updatedAt')}:</dt>
              <dd>
                {installationType.updatedAt
                  ? new Date(installationType.updatedAt).toLocaleString()
                  : '-'}
              </dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}
