'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { bus_lines } from '@repo/ims-client';
import useQueryAllServiceTypes from '@/app/service-types/hooks/use-query-all-service-types';
import useQueryAllTransporters from '@/app/transporters/hooks/use-query-all-transporters';
import useBusLineMutations from '@/bus-lines/hooks/use-bus-line-mutations';
import useQueryBusLines from '@/bus-lines/hooks/use-query-bus-lines';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable, DataTableColumnDef } from '@/components/data-table';
import { FilterConfig } from '@/components/data-table/data-table-header';
import IsActiveBadge from '@/components/is-active-badge';
import useServerTableEvents from '@/hooks/use-server-table-events';
import useTableUrlState from '@/hooks/use-table-url-state';
import routes from '@/services/routes';
import { UseTranslationsResult } from '@/types/use-translation-result';

interface BusLinesColumnsFactoryProps {
  tCommon: UseTranslationsResult;
  tBusLines: UseTranslationsResult;
}

function busLinesColumnsFactory({
  tCommon,
  tBusLines,
}: BusLinesColumnsFactoryProps): DataTableColumnDef<bus_lines.BusLine>[] {
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
      accessorKey: 'transporterId',
      header: tBusLines('fields.transporter'),
    },
    {
      accessorKey: 'serviceTypeId',
      header: tBusLines('fields.serviceType'),
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

export default function BusLinesTable() {
  const tCommon = useTranslations('common');
  const tBusLines = useTranslations('busLines');
  const {
    paginationUrlState,
    sortingUrlState,
    filtersUrlState,
    searchUrlState,
    setPaginationUrlState,
    setSortingUrlState,
    setSearchUrlState,
    setFiltersUrlState,
  } = useTableUrlState<bus_lines.BusLine>();
  const { data, isLoading, error, refetch } = useQueryBusLines({
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
  const { deleteBusLine } = useBusLineMutations();
  const [deleteId, setDeleteId] = useState<number>();
  const { data: transporters } = useQueryAllTransporters();
  const { data: serviceTypes } = useQueryAllServiceTypes();

  const filtersConfig: FilterConfig[] = [
    {
      name: tBusLines('fields.transporter'),
      key: 'transporterId',
      options:
        transporters?.transporters.map((transporter) => ({
          label: transporter.name,
          value: transporter.id,
        })) ?? [],
    },
    {
      name: tBusLines('fields.serviceType'),
      key: 'serviceTypeId',
      options:
        serviceTypes?.serviceTypes.map((serviceType) => ({
          label: serviceType.name,
          value: serviceType.id,
        })) ?? [],
    },
    {
      name: tCommon('fields.active'),
      key: 'active',
      options: [
        { label: tCommon('status.active'), value: true },
        { label: tCommon('status.inactive'), value: false },
      ],
    },
  ];

  const onConfirmDelete = () => {
    if (!deleteId) return;
    deleteBusLine.mutateWithToast(deleteId);
    setDeleteId(undefined);
  };

  const columns = busLinesColumnsFactory({
    tCommon,
    tBusLines,
  });

  return (
    <>
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        hasError={!!error}
        onRetry={refetch}
        addHref={routes.busLines.new}
        onDelete={setDeleteId}
        routes={routes.busLines}
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
      />
      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={() => setDeleteId(undefined)}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
