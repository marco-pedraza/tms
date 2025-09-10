'use client';

import { useTranslations } from 'next-intl';
import { buses } from '@repo/ims-client';
import BusStatusBadge from '@/buses/components/bus-status-badge';
import useBusMutations from '@/buses/hooks/use-bus-mutations';
import useQueryBuses from '@/buses/hooks/use-query-buses';
import busStatusTranslationKeys from '@/buses/translations/bus-status-translations-keys';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable, DataTableColumnDef } from '@/components/data-table';
import { FilterConfig } from '@/components/data-table/data-table-header';
import IsActiveBadge from '@/components/is-active-badge';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import useServerTableEvents from '@/hooks/use-server-table-events';
import useTableUrlState from '@/hooks/use-table-url-state';
import routes from '@/services/routes';
import type {
  KnownBusStatuses,
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

  const filtersConfig: FilterConfig[] = [
    {
      name: tBuses('fields.status'),
      key: 'status',
      options: Object.entries(busStatusTranslationKeys).map(
        ([key, value]: [string, KnownBusStatuses]) => ({
          label: tBuses(`status.${value}`),
          value: key,
        }),
      ),
    },
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
        filtersConfig={filtersConfig}
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
