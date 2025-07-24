'use client';

import { useTranslations } from 'next-intl';
import { populations } from '@repo/ims-client';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable, DataTableColumnDef } from '@/components/data-table';
import IsActiveBadge from '@/components/is-active-badge';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import useServerTableEvents from '@/hooks/use-server-table-events';
import useTableUrlState from '@/hooks/use-table-url-state';
import usePopulationMutations from '@/populations/hooks/use-population-mutations';
import useQueryPopulations from '@/populations/hooks/use-query-populations';
import routes from '@/services/routes';
import type { UseCommonTranslationsResult } from '@/types/translations';

interface PopulationsColumnsFactoryProps {
  tCommon: UseCommonTranslationsResult;
}

function populationsColumnsFactory({
  tCommon,
}: PopulationsColumnsFactoryProps): DataTableColumnDef<populations.Population>[] {
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
      accessorKey: 'description',
      header: tCommon('fields.description'),
      sortable: true,
    },
    {
      accessorKey: 'active',
      header: tCommon('fields.active'),
      cell: ({ row }) => {
        const active = row.original.active;
        return <IsActiveBadge isActive={active} />;
      },
      sortable: true,
    },
  ];
}

export default function PopulationsTable() {
  const tCommon = useTranslations('common');
  const {
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
    searchUrlState,
    setSearchUrlState,
  } = useTableUrlState<populations.Population>();
  const { data, isLoading, error, refetch } = useQueryPopulations({
    page: paginationUrlState.page,
    pageSize: paginationUrlState.pageSize,
    searchTerm: searchUrlState,
    orderBy: sortingUrlState,
    filters: {},
  });
  const { onSortingChange, onPaginationChange } = useServerTableEvents({
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
  });
  const { delete: deletePopulation } = usePopulationMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deletePopulation.mutateWithToast,
    });

  const columns = populationsColumnsFactory({
    tCommon,
  });

  return (
    <>
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        hasError={!!error}
        onRetry={refetch}
        addHref={routes.populations.new}
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
        onDelete={setDeleteId}
        routes={routes.populations}
      />
      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
