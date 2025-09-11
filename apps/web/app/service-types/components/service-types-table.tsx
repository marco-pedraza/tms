'use client';

import { useTranslations } from 'next-intl';
import type { service_types } from '@repo/ims-client';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable, DataTableColumnDef } from '@/components/data-table';
import { FilterConfig } from '@/components/data-table/data-table-header';
import IsActiveBadge from '@/components/is-active-badge';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import useServerTableEvents from '@/hooks/use-server-table-events';
import useTableUrlState from '@/hooks/use-table-url-state';
import routes from '@/services/routes';
import type { UseCommonTranslationsResult } from '@/types/translations';
import useQueryServiceTypes from '../hooks/use-query-service-types';
import useServiceTypeMutations from '../hooks/use-service-type-mutations';

interface ColumnsFactoryProps {
  tCommon: UseCommonTranslationsResult;
}

function columnsFactory({
  tCommon,
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
  const {
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
    searchUrlState,
    setSearchUrlState,
    filtersUrlState,
    setFiltersUrlState,
  } = useTableUrlState<service_types.ServiceType>();

  const { data, isLoading, error, refetch } = useQueryServiceTypes({
    page: paginationUrlState.page,
    pageSize: paginationUrlState.pageSize,
    orderBy: sortingUrlState,
    searchTerm: searchUrlState,
    filters: filtersUrlState,
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

  const columns = columnsFactory({ tCommon });

  const filtersConfig: FilterConfig[] = [
    {
      name: tCommon('fields.status'),
      key: 'active',
      options: [
        { label: tCommon('status.active'), value: true },
        { label: tCommon('status.inactive'), value: false },
      ],
    },
  ];

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
        filtersConfig={filtersConfig}
        filtersState={filtersUrlState}
        onFiltersChange={setFiltersUrlState}
      />
      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
