'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { states } from '@repo/ims-client';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable, DataTableColumnDef } from '@/components/data-table';
import IsActiveBadge from '@/components/is-active-badge';
import useServerTableEvents from '@/hooks/use-server-table-events';
import useTableUrlState from '@/hooks/use-table-url-state';
import routes from '@/services/routes';
import useQueryStates from '@/states/hooks/use-query-states';
import useStateMutations from '@/states/hooks/use-state-mutations';
import { UseTranslationsResult } from '@/types/translations';

interface StatesColumnsFactoryProps {
  tCommon: UseTranslationsResult;
}

const statesColumnsFactory = ({
  tCommon,
}: StatesColumnsFactoryProps): DataTableColumnDef<states.State>[] => {
  return [
    {
      accessorKey: 'name',
      header: tCommon('fields.name'),
      sortable: true,
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'code',
      header: tCommon('fields.code'),
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
      accessorKey: 'createdAt',
      header: tCommon('fields.createdAt'),
      sortable: true,
      cell: ({ row }) => {
        const value = row.getValue('createdAt');
        return value ? new Date(value as string).toLocaleDateString() : '-';
      },
    },
  ];
};

export default function StatesTable() {
  const tCommon = useTranslations('common');
  const [deleteId, setDeleteId] = useState<number>();
  const { delete: deleteState } = useStateMutations();
  const {
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
  } = useTableUrlState<states.State>();
  const { data, isLoading, error, refetch } = useQueryStates({
    page: paginationUrlState.page,
    pageSize: paginationUrlState.pageSize,
    orderBy: sortingUrlState,
    searchTerm: '',
    filters: {},
  });
  const { onSortingChange, onPaginationChange } = useServerTableEvents({
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
  });

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteState.mutateWithToast(deleteId);
    setDeleteId(undefined);
  };

  const columns = statesColumnsFactory({ tCommon });

  return (
    <>
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        hasError={!!error}
        onRetry={refetch}
        addHref={routes.states.new}
        onDelete={setDeleteId}
        routes={routes.states}
        pagination={{
          pageIndex: paginationUrlState.page - 1,
          pageSize: paginationUrlState.pageSize,
          pageCount: data?.pagination.totalPages ?? 0,
        }}
        onPaginationChange={onPaginationChange}
        sorting={sortingUrlState}
        onSortingChange={onSortingChange}
      />
      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={() => setDeleteId(undefined)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
