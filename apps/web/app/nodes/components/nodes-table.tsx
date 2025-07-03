'use client';

import { useTranslations } from 'next-intl';
import { nodes } from '@repo/ims-client';
import useQueryAllCities from '@/cities/hooks/use-query-all-cities';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable, DataTableColumnDef } from '@/components/data-table';
import { FilterConfig } from '@/components/data-table/data-table-header';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import useServerTableEvents from '@/hooks/use-server-table-events';
import useTableUrlState from '@/hooks/use-table-url-state';
import useNodeMutations from '@/nodes/hooks/use-node-mutations';
import useQueryNodes from '@/nodes/hooks/use-query-nodes';
import routes from '@/services/routes';
import type { UseTranslationsResult } from '@/types/translations';

interface NodesColumnsFactoryProps {
  tCommon: UseTranslationsResult;
  tNodes: UseTranslationsResult;
}

function nodesColumnsFactory({
  tCommon,
  tNodes,
}: NodesColumnsFactoryProps): DataTableColumnDef<nodes.Node>[] {
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
      id: 'city',
      accessorKey: 'city.name',
      header: tNodes('fields.city'),
      sortable: true,
    },
  ];
}

export default function NodesTable() {
  const tCommon = useTranslations('common');
  const tNodes = useTranslations('nodes');
  const {
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
    searchUrlState,
    setSearchUrlState,
    filtersUrlState,
    setFiltersUrlState,
  } = useTableUrlState<nodes.Node>();
  const { data, isLoading, error, refetch } = useQueryNodes({
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
  const { data: cities } = useQueryAllCities();
  const { delete: deleteNode } = useNodeMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deleteNode.mutateWithToast,
    });

  const filtersConfig: FilterConfig[] = [
    {
      name: tNodes('fields.city'),
      key: 'cityId',
      options:
        cities?.data.map((city) => ({
          label: city.name,
          value: city.id,
        })) ?? [],
    },
  ];

  const columns = nodesColumnsFactory({
    tCommon,
    tNodes,
  });

  return (
    <>
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        hasError={!!error}
        onRetry={refetch}
        addHref={routes.nodes.new}
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
        routes={routes.nodes}
      />
      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
