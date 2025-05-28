'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { transporters } from '@repo/ims-client';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable, DataTableColumnDef } from '@/components/data-table';
import IsActiveBadge from '@/components/is-active-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import useServerTableEvents from '@/hooks/use-server-table-events';
import useTableUrlState from '@/hooks/use-table-url-state';
import routes from '@/services/routes';
import useQueryTransporters from '@/transporters/hooks/use-query-transporters';
import useTransporterMutations from '@/transporters/hooks/use-transporter-mutations';
import type { UseTranslationsResult } from '@/types/UseTranslationsResult';

interface TransportersColumnsFactoryProps {
  onDelete: (id: number) => void;
  tCommon: UseTranslationsResult;
  tTransporters: UseTranslationsResult;
}

function transportersColumnsFactory({
  onDelete,
  tCommon,
  tTransporters,
}: TransportersColumnsFactoryProps): DataTableColumnDef<transporters.Transporter>[] {
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
      accessorKey: 'licenseNumber',
      header: tTransporters('fields.licenseNumber'),
    },
    {
      accessorKey: 'active',
      header: tCommon('fields.active'),
      cell: ({ row }) => {
        const active = row.original.active;
        return <IsActiveBadge isActive={active} />;
      },
    },
    {
      accessorKey: 'email',
      header: tCommon('fields.email'),
    },
    {
      accessorKey: 'phone',
      header: tCommon('fields.phone'),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const record = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <Link
              href={routes.transporters.getDetailsRoute(record.id.toString())}
            >
              <Button variant="ghost" size="sm">
                {tCommon('actions.view')}
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">{tCommon('actions.more')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link
                  href={routes.transporters.getEditRoute(record.id.toString())}
                >
                  <Button variant="ghost" className="w-full justify-start">
                    {tCommon('actions.edit')}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => onDelete(record.id)}
                >
                  {tCommon('actions.delete')}
                </Button>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}

export default function TransportersTable() {
  const tCommon = useTranslations('common');
  const tTransporters = useTranslations('transporters');
  const {
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
  } = useTableUrlState<transporters.Transporter>();
  const { data, isLoading, error, refetch } = useQueryTransporters({
    page: paginationUrlState.page,
    pageSize: paginationUrlState.pageSize,
    searchTerm: '',
    orderBy: sortingUrlState,
    filters: {},
  });
  const {
    onPreviousPage,
    onNextPage,
    onLastPage,
    onFirstPage,
    setPageSize,
    onSortingChange,
  } = useServerTableEvents({
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
    totalPagesCount: data?.pagination.totalPages ?? 0,
  });
  const { deleteTransporter } = useTransporterMutations();
  const [deleteId, setDeleteId] = useState<number>();

  const onConfirmDelete = () => {
    if (!deleteId) return;
    deleteTransporter.mutateWithToast(deleteId);
    setDeleteId(undefined);
  };

  const columns = transportersColumnsFactory({
    onDelete: setDeleteId,
    tCommon,
    tTransporters,
  });

  return (
    <>
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        hasError={!!error}
        onRetry={refetch}
        addHref={routes.transporters.new}
        pagination={{
          pageIndex: paginationUrlState.page - 1,
          pageSize: paginationUrlState.pageSize,
          pageCount: data?.pagination.totalPages ?? 0,
        }}
        onPreviousPage={onPreviousPage}
        onNextPage={onNextPage}
        onLastPage={onLastPage}
        onFirstPage={onFirstPage}
        onSetPageSize={setPageSize}
        onSortingChange={onSortingChange}
        sorting={sortingUrlState}
      />
      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={() => setDeleteId(undefined)}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
