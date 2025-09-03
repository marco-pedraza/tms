'use client';

import { useTranslations } from 'next-intl';
import type { bus_diagram_models } from '@repo/ims-client';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable, DataTableColumnDef } from '@/components/data-table';
import IsActiveBadge from '@/components/is-active-badge';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import useServerTableEvents from '@/hooks/use-server-table-events';
import useTableUrlState from '@/hooks/use-table-url-state';
import useQuerySeatDiagrams from '@/seat-diagrams/hooks/use-query-seat-diagrams';
import useSeatDiagramMutations from '@/seat-diagrams/hooks/use-seat-diagram-mutations';
import routes from '@/services/routes';
import {
  UseCommonTranslationsResult,
  UseSeatDiagramsTranslationsResult,
} from '@/types/translations';

interface SeatDiagramsColumnsFactoryProps {
  tCommon: UseCommonTranslationsResult;
  tSeatDiagrams: UseSeatDiagramsTranslationsResult;
}

const seatDiagramsColumnsFactory = ({
  tCommon,
  tSeatDiagrams,
}: SeatDiagramsColumnsFactoryProps): DataTableColumnDef<bus_diagram_models.BusDiagramModel>[] => {
  return [
    {
      accessorKey: 'name',
      header: tCommon('fields.name'),
      sortable: true,
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: 'maxCapacity',
      header: tSeatDiagrams('fields.maxCapacity'),
      sortable: true,
      cell: ({ row }) => {
        const capacity = row.original.maxCapacity;
        return (
          <span>
            {tSeatDiagrams('fields.passengers', {
              count: capacity,
            })}
          </span>
        );
      },
    },
    {
      accessorKey: 'totalSeats',
      header: tSeatDiagrams('fields.totalSeats'),
      sortable: true,
      cell: ({ row }) => {
        const totalSeats = row.original.totalSeats;
        return (
          <span>
            {tSeatDiagrams('fields.seats', {
              count: totalSeats,
            })}
          </span>
        );
      },
    },
    {
      accessorKey: 'numFloors',
      header: tSeatDiagrams('fields.numFloors'),
      sortable: true,
      cell: ({ row }) => {
        const numFloors = row.original.numFloors;
        return (
          <span>
            {tSeatDiagrams('fields.floors', {
              count: numFloors,
            })}
          </span>
        );
      },
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
        return value ? new Date(value).toLocaleDateString() : '-';
      },
    },
  ];
};

export default function SeatDiagramsTable() {
  const tCommon = useTranslations('common');
  const tSeatDiagrams = useTranslations('seatDiagrams');
  const { delete: deleteSeatDiagram } = useSeatDiagramMutations();
  const {
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
    searchUrlState,
    setSearchUrlState,
  } = useTableUrlState<bus_diagram_models.BusDiagramModel>();
  const { data, isLoading, error, refetch } = useQuerySeatDiagrams({
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
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deleteSeatDiagram.mutateWithToast,
    });

  const columns = seatDiagramsColumnsFactory({ tCommon, tSeatDiagrams });

  return (
    <>
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        hasError={!!error}
        onRetry={refetch}
        addHref={routes.seatDiagrams.new}
        onDelete={setDeleteId}
        routes={routes.seatDiagrams}
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
