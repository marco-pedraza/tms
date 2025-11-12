'use client';

import { useTranslations } from 'next-intl';
import type { routes as routesType } from '@repo/ims-client';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable, DataTableColumnDef } from '@/components/data-table';
import { FilterConfig } from '@/components/data-table/data-table-header';
import IsActiveBadge from '@/components/is-active-badge';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import useServerTableEvents from '@/hooks/use-server-table-events';
import useTableUrlState from '@/hooks/use-table-url-state';
import useQueryRoutes from '@/routes/hooks/use-query-routes';
import useRoutesMutations from '@/routes/hooks/use-routes-mutations';
import routes from '@/services/routes';
import { SortBy } from '@/types/sort-by';
import {
  UseCommonTranslationsResult,
  UseRoutesTranslationsResult,
} from '@/types/translations';

interface RoutesColumnsFactoryProps {
  tRoutes: UseRoutesTranslationsResult;
  tCommon: UseCommonTranslationsResult;
}

/**
 * Creates column definitions for the routes data table
 * @param props - Column factory properties containing translations
 * @returns Array of column definitions for the data table
 */
function routesColumnsFactory({
  tRoutes,
  tCommon,
}: RoutesColumnsFactoryProps): DataTableColumnDef<routesType.RouteWithRelations>[] {
  return [
    {
      accessorKey: 'code',
      header: tCommon('fields.code'),
      sortable: true,
    },
    {
      accessorKey: 'name',
      header: tRoutes('fields.name'),
      sortable: true,
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'serviceType.name',
      header: tCommon('fields.serviceType'),
      sortable: true,
    },
    {
      accessorKey: 'busline.name',
      header: tRoutes('fields.busline'),
      sortable: true,
    },
    {
      accessorKey: 'originNode.code',
      header: tRoutes('fields.origin'),
      sortable: true,
    },
    {
      accessorKey: 'destinationNode.code',
      header: tRoutes('fields.destination'),
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
  ];
}

/**
 * RoutesTable
 * Server-driven table for listing routes with sorting, search, pagination, and delete flow.
 */
export default function RoutesTable() {
  const tRoutes = useTranslations('routes');
  const tCommon = useTranslations('common');
  const { delete: deleteRoute } = useRoutesMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deleteRoute.mutateWithToast,
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
  } = useTableUrlState<routesType.RouteWithRelations>();
  const { data, isLoading, error, refetch } = useQueryRoutes({
    page: paginationUrlState.page,
    pageSize: paginationUrlState.pageSize,
    orderBy: sortingUrlState as SortBy<routesType.Route>,
    searchTerm: searchUrlState,
    filters: filtersUrlState,
  });
  const { onSortingChange, onPaginationChange } = useServerTableEvents({
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
  });

  const columns = routesColumnsFactory({ tRoutes, tCommon });

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
        addHref={routes.routes.new}
        onDelete={setDeleteId}
        routes={routes.routes}
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
