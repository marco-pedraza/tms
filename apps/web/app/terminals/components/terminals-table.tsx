'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { terminals } from '@repo/ims-client';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable, DataTableColumnDef } from '@/components/data-table';
import IsActiveBadge from '@/components/is-active-badge';
import useServerTableEvents from '@/hooks/use-server-table-events';
import useTableUrlState from '@/hooks/use-table-url-state';
import routes from '@/services/routes';
import useQueryTerminals from '@/terminals/hooks/use-query-terminals';
import useTerminalMutations from '@/terminals/hooks/use-terminal-mutations';
import { UseTranslationsResult } from '@/types/translations';

interface TerminalsColumnsFactoryProps {
  tCommon: UseTranslationsResult;
  tTerminals: UseTranslationsResult;
}

const terminalsColumnsFactory = ({
  tCommon,
  tTerminals,
}: TerminalsColumnsFactoryProps): DataTableColumnDef<terminals.Terminal>[] => {
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
      cell: ({ row }) => <div>{row.getValue('code')}</div>,
    },
    {
      accessorKey: 'slug',
      header: tTerminals('fields.slug'),
      cell: ({ row }) => <div>{row.getValue('slug')}</div>,
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

export default function TerminalsTable() {
  const tTerminals = useTranslations('terminals');
  const tCommon = useTranslations('common');
  const [deleteId, setDeleteId] = useState<number>();
  const { deleteTerminal } = useTerminalMutations();
  const {
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
  } = useTableUrlState<terminals.Terminal>();
  const { data, isLoading, error, refetch } = useQueryTerminals({
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
    deleteTerminal.mutateWithToast(deleteId);
    setDeleteId(undefined);
  };

  const columns = terminalsColumnsFactory({ tCommon, tTerminals });

  return (
    <>
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        hasError={!!error}
        onRetry={refetch}
        addHref={routes.terminals.new}
        pagination={{
          pageIndex: paginationUrlState.page - 1,
          pageSize: paginationUrlState.pageSize,
          pageCount: data?.pagination.totalPages ?? 0,
        }}
        onPaginationChange={onPaginationChange}
        sorting={sortingUrlState}
        onSortingChange={onSortingChange}
        onDelete={setDeleteId}
        routes={routes.terminals}
      />
      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={() => setDeleteId(undefined)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
