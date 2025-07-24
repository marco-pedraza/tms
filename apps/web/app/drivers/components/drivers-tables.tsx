import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { drivers } from '@repo/ims-client';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable, DataTableColumnDef } from '@/components/data-table';
import { FilterConfig } from '@/components/data-table/data-table-header';
import DriverStatusBadge from '@/drivers/components/driver-status-badge';
import useDriversMutations from '@/drivers/hooks/use-drivers-mutations';
import useQueryDrivers from '@/drivers/hooks/use-query-drivers';
import driverTypeTranslationKeys from '@/drivers/translations/driver-type-translation-keys';
import useServerTableEvents from '@/hooks/use-server-table-events';
import useTableUrlState from '@/hooks/use-table-url-state';
import routes from '@/services/routes';
import { UseDriversTranslationsResult } from '@/types/translations';
import driverStatusTranslationKeys from '../translations/driver-status-translation-keys';

interface DriversColumnsFactoryProps {
  tDrivers: UseDriversTranslationsResult;
}

const driversColumnsFactory = ({
  tDrivers,
}: DriversColumnsFactoryProps): DataTableColumnDef<drivers.Driver>[] => {
  return [
    {
      accessorKey: 'driverKey',
      header: tDrivers('fields.driverKey'),
    },
    {
      accessorKey: 'fullName',
      header: tDrivers('fields.fullName'),
      sortable: true,
    },
    {
      accessorKey: 'driverType',
      header: tDrivers('fields.driverType'),
      sortable: true,
      cell: ({ row }) =>
        // @ts-expect-error - Need to improve typing for driverTypeTranslationKeys
        tDrivers(driverTypeTranslationKeys[row.original.driverType]),
    },
    {
      accessorKey: 'transporter.name',
      header: tDrivers('fields.transporter'),
      sortable: true,
    },
    {
      accessorKey: 'busLine.name',
      header: tDrivers('fields.busLine'),
      sortable: true,
    },
    {
      accessorKey: 'busId',
      header: tDrivers('fields.assignedBus'),
      sortable: true,
    },
    {
      accessorKey: 'status',
      header: tDrivers('fields.driverStatus'),
      sortable: true,
      cell: ({ row }) => <DriverStatusBadge status={row.original.status} />,
    },
  ];
};

export default function DriversTable() {
  const tDrivers = useTranslations('drivers');
  const [deleteId, setDeleteId] = useState<number>();
  const { delete: deleteDriver } = useDriversMutations();
  const {
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
    searchUrlState,
    setSearchUrlState,
    filtersUrlState,
    setFiltersUrlState,
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

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteDriver.mutateWithToast(deleteId);
    setDeleteId(undefined);
  };

  const filtersConfig: FilterConfig[] = [
    {
      name: tDrivers('fields.driverType'),
      key: 'driverType',
      options: Object.keys(driverTypeTranslationKeys).map((type) => ({
        // @ts-expect-error - Need to improve typing for driverTypeTranslationKeys
        label: tDrivers(driverTypeTranslationKeys[type as drivers.DriverType]),
        value: type,
      })),
    },
    {
      name: tDrivers('fields.driverStatus'),
      key: 'status',
      options: Object.keys(driverStatusTranslationKeys).map((status) => ({
        label: tDrivers(
          // @ts-expect-error - Need to improve typing for driverTypeTranslationKeys
          driverStatusTranslationKeys[status as drivers.DriverStatus],
        ),
        value: status,
      })),
    },
  ];

  const columns = driversColumnsFactory({ tDrivers });

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
        onDelete={setDeleteId}
        routes={routes.drivers}
        initialSearchValue={searchUrlState}
        onSearchChange={setSearchUrlState}
        filtersConfig={filtersConfig}
        filtersState={filtersUrlState}
        onFiltersChange={setFiltersUrlState}
      />
      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={() => setDeleteId(undefined)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
