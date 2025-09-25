'use client';

import { useTranslations } from 'next-intl';
import type { pathways } from '@repo/ims-client';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable, DataTableColumnDef } from '@/components/data-table';
import { FilterConfig } from '@/components/data-table/data-table-header';
import IsActiveBadge from '@/components/is-active-badge';
import IsEmptyTripBadge from '@/components/is-empty-trip-badge';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import useServerTableEvents from '@/hooks/use-server-table-events';
import useTableUrlState from '@/hooks/use-table-url-state';
import usePathwayMutations from '@/pathways/hooks/use-pathway-mutations';
import useQueryPathways from '@/pathways/hooks/use-query-pathways';
import routes from '@/services/routes';
import {
  UseCommonTranslationsResult,
  UsePathwaysTranslationsResult,
} from '@/types/translations';

interface PathwaysColumnsFactoryProps {
  tPathways: UsePathwaysTranslationsResult;
  tCommon: UseCommonTranslationsResult;
}

/**
 * Creates column definitions for the pathways data table
 * @param props - Column factory properties containing translations
 * @returns Array of column definitions for the data table
 */
function pathwaysColumnsFactory({
  tPathways,
  tCommon,
}: PathwaysColumnsFactoryProps): DataTableColumnDef<pathways.Pathway>[] {
  return [
    {
      accessorKey: 'code',
      header: tCommon('fields.code'),
      sortable: true,
    },
    {
      accessorKey: 'name',
      header: tPathways('fields.name'),
      sortable: true,
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'origin.code',
      header: tPathways('fields.origin'),
      sortable: true,
    },
    {
      accessorKey: 'destination.code',
      header: tPathways('fields.destination'),
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
      accessorKey: 'isEmptyTrip',
      header: tPathways('fields.isEmptyTrip'),
      sortable: true,
      cell: ({ row }) => {
        const isEmptyTrip = row.original.isEmptyTrip;
        return <IsEmptyTripBadge isEmptyTrip={isEmptyTrip} />;
      },
    },
  ];
}

/**
 * PathwaysTable
 * Server-driven table for listing pathways with sorting, search, pagination, and delete flow.
 */
export default function PathwaysTable() {
  const tPathways = useTranslations('pathways');
  const tCommon = useTranslations('common');
  const { delete: deletePathway } = usePathwayMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deletePathway.mutateWithToast,
    });
  const {
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
    searchUrlState,
    setSearchUrlState,
    filtersUrlState,
    setFiltersUrlState,
  } = useTableUrlState<pathways.Pathway>();
  const { data, isLoading, error, refetch } = useQueryPathways({
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

  const columns = pathwaysColumnsFactory({ tPathways, tCommon });

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
        addHref={routes.pathways.new}
        onDelete={setDeleteId}
        routes={routes.pathways}
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
