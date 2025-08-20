'use client';

import { useTranslations } from 'next-intl';
import type { bus_models } from '@repo/ims-client';
import useBusModelMutations from '@/bus-models/hooks/use-bus-model-mutations';
import useQueryBusModels from '@/bus-models/hooks/use-query-bus-models';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable, DataTableColumnDef } from '@/components/data-table';
import IsActiveBadge from '@/components/is-active-badge';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import useServerTableEvents from '@/hooks/use-server-table-events';
import useTableUrlState from '@/hooks/use-table-url-state';
import routes from '@/services/routes';
import {
  UseBusModelsTranslationsResult,
  UseCommonTranslationsResult,
} from '@/types/translations';

interface BusModelsColumnsFactoryProps {
  tBusModels: UseBusModelsTranslationsResult;
  tCommon: UseCommonTranslationsResult;
}

const busModelsColumnsFactory = ({
  tBusModels,
  tCommon,
}: BusModelsColumnsFactoryProps): DataTableColumnDef<bus_models.BusModel>[] => {
  return [
    {
      accessorKey: 'manufacturer',
      header: tBusModels('fields.manufacturer'),
      sortable: true,
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('manufacturer')}</div>
      ),
    },
    {
      accessorKey: 'model',
      header: tBusModels('fields.model'),
      sortable: true,
    },
    {
      accessorKey: 'year',
      header: tBusModels('fields.year'),
      sortable: true,
    },
    {
      accessorKey: 'seatingCapacity',
      header: tBusModels('fields.seatingCapacity'),
      sortable: true,
    },
    {
      accessorKey: 'numFloors',
      header: tBusModels('fields.numFloors'),
      sortable: true,
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
    {
      accessorKey: 'createdAt',
      header: tCommon('fields.createdAt'),
      sortable: true,
      cell: ({ row }) => {
        const value = row.original.createdAt;
        return value ? new Date(value as string).toLocaleDateString() : '-';
      },
    },
  ];
};

export default function BusModelsTable() {
  const tBusModels = useTranslations('busModels');
  const tCommon = useTranslations('common');
  const { delete: deleteBusModel } = useBusModelMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deleteBusModel.mutateWithToast,
    });
  const {
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
    searchUrlState,
    setSearchUrlState,
  } = useTableUrlState<bus_models.BusModel>();
  const { data, isLoading, error, refetch } = useQueryBusModels({
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

  const columns = busModelsColumnsFactory({ tBusModels, tCommon });

  return (
    <>
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        hasError={!!error}
        onRetry={refetch}
        addHref={routes.busModels.new}
        onDelete={setDeleteId}
        routes={routes.busModels}
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
      />
      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
