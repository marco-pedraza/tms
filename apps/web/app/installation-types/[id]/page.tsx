'use client';

import { useTranslations } from 'next-intl';
import { installation_schemas } from '@repo/ims-client';
import ActionButtons from '@/components/action-buttons';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable, DataTableColumnDef } from '@/components/data-table';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import InstallationTypeSkeleton from '@/installation-types/components/installation-type-skeleton';
import useInstallationTypeMutations from '@/installation-types/hooks/use-installation-type-mutations';
import useQueryInstallationType from '@/installation-types/hooks/use-query-installation-type';
import useQueryInstallationTypeSchemas from '@/installation-types/hooks/use-query-installation-type-schemas';
import routes from '@/services/routes';
import {
  UseCommonTranslationsResult,
  UseInstallationTypesTranslationsResult,
} from '@/types/translations';

const createInstallationTypeSchemasColumns = ({
  tCommon,
  tInstallationTypes,
}: {
  tCommon: UseCommonTranslationsResult;
  tInstallationTypes: UseInstallationTypesTranslationsResult;
}): DataTableColumnDef<installation_schemas.InstallationSchema>[] => {
  return [
    {
      accessorKey: 'name',
      header: tCommon('fields.name'),
      cell: ({ row }) => (
        <div className="capitalize font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'type',
      header: tInstallationTypes('form.fields.dataType'),
      cell: ({ row }) =>
        // @ts-expect-error - No better way to type this for now
        tInstallationTypes(`form.schemas.fieldTypes.${row.getValue('type')}`),
    },
    {
      accessorKey: 'required',
      header: tInstallationTypes('form.fields.required'),
      cell: ({ row }) =>
        tInstallationTypes(
          `form.schemas.${row.getValue('required') ? 'required' : 'notRequired'}`,
        ),
    },
    {
      accessorKey: 'enumValues',
      header: tInstallationTypes('form.fields.enumValues'),
      cell: ({ row }) => {
        const enumValues = row.original.options?.enumValues;
        return <div>{enumValues?.join(', ')}</div>;
      },
    },
    {
      accessorKey: 'description',
      header: tCommon('fields.description'),
    },
    {
      accessorKey: 'createdAt',
      header: tCommon('fields.createdAt'),
      cell: ({ row }) => {
        const value = row.getValue('createdAt');
        return value ? new Date(value as string).toLocaleDateString() : '-';
      },
    },
  ];
};

export default function InstallationTypeDetailsPage() {
  const tInstallationTypes = useTranslations('installationTypes');
  const tCommon = useTranslations('common');
  const { itemId: installationTypeId, isValidId } =
    useCollectionItemDetailsParams();
  const { data: installationType, isLoading } = useQueryInstallationType({
    itemId: installationTypeId,
    enabled: isValidId,
  });
  const {
    data: installationSchemas,
    isLoading: isLoadingSchemas,
    error: errorLoadingSchemas,
    refetch: refetchSchemas,
  } = useQueryInstallationTypeSchemas({
    installationTypeId,
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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            {tInstallationTypes('form.sections.schemas.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* @todo Implement segregated interfaces for read only and editable cases for the DataTable component. */}
          {/* @ts-expect-error - This table is read only, so we don't need to pass the onDelete prop.*/}
          <DataTable
            data={installationSchemas?.data ?? []}
            columns={createInstallationTypeSchemasColumns({
              tCommon,
              tInstallationTypes,
            })}
            isLoading={isLoadingSchemas}
            hasError={!!errorLoadingSchemas}
            onRetry={refetchSchemas}
            addHref={routes.installationTypes.getEditRoute(
              installationType.id.toString(),
            )}
            routes={routes.installationTypes}
            displayActionsColumn={false}
          />
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}
