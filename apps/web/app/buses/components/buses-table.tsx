'use client';

import { useTranslations } from 'next-intl';
import { buses } from '@repo/ims-client';
import BusStatusBadge from '@/buses/components/bus-status-badge';
import useBusMutations from '@/buses/hooks/use-bus-mutations';
import useQueryBuses from '@/buses/hooks/use-query-buses';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable, DataTableColumnDef } from '@/components/data-table';
import IsActiveBadge from '@/components/is-active-badge';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import useServerTableEvents from '@/hooks/use-server-table-events';
import useTableUrlState from '@/hooks/use-table-url-state';
import routes from '@/services/routes';
import type {
  UseBusesTranslationsResult,
  UseCommonTranslationsResult,
} from '@/types/translations';

interface BusesColumnsFactoryProps {
  tCommon: UseCommonTranslationsResult;
  tBuses: UseBusesTranslationsResult;
}

function busesColumnsFactory({
  tCommon,
  tBuses,
}: BusesColumnsFactoryProps): DataTableColumnDef<buses.Bus>[] {
  return [
    {
      accessorKey: 'registrationNumber',
      header: tBuses('fields.registrationNumber'),
      sortable: true,
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('registrationNumber')}</div>
      ),
    },
    {
      accessorKey: 'economicNumber',
      header: tBuses('fields.economicNumber'),
      sortable: true,
      cell: ({ row }) => {
        const economicNumber = row.original.economicNumber;
        return economicNumber ? (
          <div>{economicNumber}</div>
        ) : (
          <div className="text-muted-foreground">-</div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: tBuses('fields.status'),
      sortable: true,
      cell: ({ row }) => <BusStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'active',
      header: tCommon('fields.active'),
      sortable: true,
      cell: ({ row }) => {
        const active = row.original.active;
        return <IsActiveBadge isActive={active} />;
      },
    },
  ];
}

export default function BusesTable() {
  const tCommon = useTranslations('common');
  const tBuses = useTranslations('buses');
  const {
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
    searchUrlState,
    setSearchUrlState,
    filtersUrlState,
    setFiltersUrlState,
  } = useTableUrlState<buses.Bus>();
  const { data, isLoading, error, refetch } = useQueryBuses({
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
  const { delete: deleteBus } = useBusMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deleteBus.mutateWithToast,
    });

  const columns = busesColumnsFactory({
    tCommon,
    tBuses,
  });

  return (
    <>
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        hasError={!!error}
        onRetry={refetch}
        addHref={routes.buses.new}
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
        routes={routes.buses}
      />
      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
