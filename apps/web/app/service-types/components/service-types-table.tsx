'use client';

import { useTranslations } from 'next-intl';
import type { service_types } from '@repo/ims-client';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable, DataTableColumnDef } from '@/components/data-table';
import IsActiveBadge from '@/components/is-active-badge';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import useServerTableEvents from '@/hooks/use-server-table-events';
import useTableUrlState from '@/hooks/use-table-url-state';
import routes from '@/services/routes';
import type {
  UseCommonTranslationsResult,
  UseServiceTypesTranslationsResult,
} from '@/types/translations';
import useQueryServiceTypes from '../hooks/use-query-service-types';
import useServiceTypeMutations from '../hooks/use-service-type-mutations';

interface ColumnsFactoryProps {
  tCommon: UseCommonTranslationsResult;
  tServiceTypes: UseServiceTypesTranslationsResult;
}

function columnsFactory({
  tCommon,
  tServiceTypes,
}: ColumnsFactoryProps): DataTableColumnDef<service_types.ServiceType>[] {
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
      accessorKey: 'category',
      header: tCommon('fields.category'),
      cell: ({ row }) => {
        return tServiceTypes(`categories.${row.original.category}`);
      },
      sortable: true,
    },
    {
      accessorKey: 'description',
      header: tCommon('fields.description'),
      sortable: false,
    },
    {
      accessorKey: 'active',
      header: tCommon('fields.status'),
      cell: ({ row }) => <IsActiveBadge isActive={row.original.active} />,
      sortable: true,
    },
  ];
}

export default function ServiceTypesTable() {
  const tCommon = useTranslations('common');
  const tServiceTypes = useTranslations('serviceTypes');
  const {
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
    searchUrlState,
    setSearchUrlState,
  } = useTableUrlState<service_types.ServiceType>();

  const { data, isLoading, error, refetch } = useQueryServiceTypes({
    page: paginationUrlState.page,
    pageSize: paginationUrlState.pageSize,
    orderBy: sortingUrlState,
    searchTerm: searchUrlState,
    filters: {},
  });

  const { onSortingChange, onPaginationChange } = useServerTableEvents({
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
  });

  const { delete: deleteServiceType } = useServiceTypeMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deleteServiceType.mutateWithToast,
    });

  const columns = columnsFactory({ tCommon, tServiceTypes });

  return (
    <>
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        hasError={!!error}
        onRetry={refetch}
        addHref={routes.serviceTypes.new}
        pagination={{
          pageIndex: paginationUrlState.page - 1,
          pageSize: paginationUrlState.pageSize,
          pageCount: data?.pagination.totalPages ?? 0,
        }}
        onPaginationChange={onPaginationChange}
        sorting={sortingUrlState}
        onSortingChange={onSortingChange}
        initialSearchValue={searchUrlState}
        onSearchChange={setSearchUrlState}
        onDelete={setDeleteId}
        routes={routes.serviceTypes}
      />
      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
