'use client';

import { useTranslations } from 'next-intl';
import { drivers } from '@repo/ims-client';
import useQueryAllBusLines from '@/app/bus-lines/hooks/use-query-all-bus-lines';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable, DataTableColumnDef } from '@/components/data-table';
import { FilterConfig } from '@/components/data-table/data-table-header';
import useDriverMutations from '@/drivers/hooks/use-driver-mutations';
import useQueryDrivers from '@/drivers/hooks/use-query-drivers';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import useServerTableEvents from '@/hooks/use-server-table-events';
import useTableUrlState from '@/hooks/use-table-url-state';
import { driverStatuses } from '@/services/ims-client';
import routes from '@/services/routes';
import type {
  UseCommonTranslationsResult,
  UseDriversTranslationsResult,
} from '@/types/translations';
import DriverStatusBadge from './driver-status-badge';

interface DriversColumnsFactoryProps {
  tCommon: UseCommonTranslationsResult;
  tDrivers: UseDriversTranslationsResult;
}

function driversColumnsFactory({
  tCommon,
  tDrivers,
}: DriversColumnsFactoryProps): DataTableColumnDef<drivers.DriverWithRelations>[] {
  return [
    {
      accessorKey: 'driverKey',
      header: tDrivers('fields.driverKey'),
      sortable: true,
    },
    {
      accessorKey: 'payrollKey',
      header: tDrivers('fields.payrollKey'),
      sortable: true,
    },
    {
      accessorKey: 'firstName',
      header: tCommon('fields.name'),
      sortable: false,
      cell: ({ row }) => {
        return `${row.original.firstName} ${row.original.lastName}`;
      },
    },
    {
      accessorKey: 'phone',
      header: tCommon('fields.phone'),
      sortable: false,
    },
    {
      accessorKey: 'busLine.name',
      header: tDrivers('fields.busLine'),
      sortable: false,
    },
    {
      accessorKey: 'status',
      header: tCommon('fields.status'),
      sortable: false,
      cell: ({ row }) => {
        const status = row.original.status;
        return <DriverStatusBadge status={status} />;
      },
    },
  ];
}

export default function DriversTable() {
  const tCommon = useTranslations('common');
  const tDrivers = useTranslations('drivers');
  const {
    paginationUrlState,
    sortingUrlState,
    filtersUrlState,
    searchUrlState,
    setPaginationUrlState,
    setSortingUrlState,
    setFiltersUrlState,
    setSearchUrlState,
  } = useTableUrlState<drivers.Driver>();
  const { data, isLoading, error, refetch } = useQueryDrivers({
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
  const { delete: deleteDriver } = useDriverMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deleteDriver.mutateWithToast,
    });
  const { data: busLines } = useQueryAllBusLines();

  const filtersConfig: FilterConfig[] = [
    {
      name: tDrivers('fields.busLine'),
      key: 'busLineId',
      options:
        busLines?.data.map((busLine) => ({
          label: busLine.name,
          value: busLine.id,
        })) ?? [],
    },
    {
      name: tCommon('fields.status'),
      key: 'status',
      options: driverStatuses
        .map((status) => ({
          label: tDrivers(`status.${status}`),
          value: status,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    },
  ];

  const columns = driversColumnsFactory({
    tCommon,
    tDrivers,
  });

  return (
    <>
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        hasError={!!error}
        onRetry={refetch}
        addHref={routes.drivers.new}
        pagination={{
          pageIndex: paginationUrlState.page - 1,
          pageSize: paginationUrlState.pageSize,
          pageCount: data?.pagination.totalPages ?? 0,
        }}
        onPaginationChange={onPaginationChange}
        sorting={sortingUrlState}
        onSortingChange={onSortingChange}
        filtersConfig={filtersConfig}
        filtersState={filtersUrlState}
        onFiltersChange={setFiltersUrlState}
        initialSearchValue={searchUrlState}
        onSearchChange={setSearchUrlState}
        onDelete={setDeleteId}
        routes={routes.drivers}
      />
      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
