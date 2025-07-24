'use client';

import { useTranslations } from 'next-intl';
import { installation_types } from '@repo/ims-client';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable, DataTableColumnDef } from '@/components/data-table';
import IsActiveBadge from '@/components/is-active-badge';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import useServerTableEvents from '@/hooks/use-server-table-events';
import useTableUrlState from '@/hooks/use-table-url-state';
import useInstallationTypeMutations from '@/installation-types/hooks/use-installation-type-mutations';
import useQueryInstallationTypes from '@/installation-types/hooks/use-query-installation-types';
import routes from '@/services/routes';
import type {
  UseCommonTranslationsResult,
  UseInstallationTypesTranslationsResult,
} from '@/types/translations';

interface InstallationTypesColumnsFactoryProps {
  tCommon: UseCommonTranslationsResult;
  tInstallationTypes: UseInstallationTypesTranslationsResult;
}

function installationTypesColumnsFactory({
  tCommon,
  tInstallationTypes,
}: InstallationTypesColumnsFactoryProps): DataTableColumnDef<installation_types.InstallationType>[] {
  return [
    {
      accessorKey: 'name',
      header: tCommon('fields.name'),
      sortable: true,
    },
    {
      accessorKey: 'code',
      header: tCommon('fields.code'),
      sortable: true,
    },
    {
      accessorKey: 'description',
      header: tInstallationTypes('fields.description'),
    },
    {
      accessorKey: 'active',
      header: tCommon('fields.status'),
      sortable: true,
      cell: ({ row }) => {
        const active = row.original.active;
        return <IsActiveBadge isActive={active} />;
      },
    },
  ];
}

export default function InstallationTypesTable() {
  const tCommon = useTranslations('common');
  const tInstallationTypes = useTranslations('installationTypes');
  const {
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
    searchUrlState,
    setSearchUrlState,
    filtersUrlState,
    setFiltersUrlState,
  } = useTableUrlState<installation_types.InstallationType>();
  const { data, isLoading, error, refetch } = useQueryInstallationTypes({
    page: paginationUrlState.page,
    pageSize: paginationUrlState.pageSize,
    searchTerm: searchUrlState,
    orderBy: sortingUrlState,
    filters: filtersUrlState,
  });
  const { onSortingChange, onPaginationChange } = useServerTableEvents({
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
  });
  const { delete: deleteInstallationType } = useInstallationTypeMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deleteInstallationType.mutateWithToast,
    });

  const columns = installationTypesColumnsFactory({
    tCommon,
    tInstallationTypes,
  });

  return (
    <>
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        hasError={!!error}
        onRetry={refetch}
        addHref={routes.installationTypes.new}
        pagination={{
          pageIndex: paginationUrlState.page - 1,
          pageSize: paginationUrlState.pageSize,
          pageCount: data?.pagination.totalPages ?? 0,
        }}
        onSortingChange={onSortingChange}
        sorting={sortingUrlState}
        initialSearchValue={searchUrlState}
        onSearchChange={setSearchUrlState}
        filtersConfig={[]}
        filtersState={filtersUrlState}
        onFiltersChange={setFiltersUrlState}
        onPaginationChange={onPaginationChange}
        onDelete={setDeleteId}
        routes={routes.installationTypes}
      />
      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
