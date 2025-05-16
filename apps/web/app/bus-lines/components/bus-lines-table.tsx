'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { bus_lines } from '@repo/ims-client';
import useBusLineMutations from '@/bus-lines/hooks/use-bus-line-mutations';
import useQueryBusLines from '@/bus-lines/hooks/use-query-bus-lines';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable } from '@/components/data-table';
import IsActiveBadge from '@/components/is-active-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import routes from '@/services/routes';
import { UseTranslationsResult } from '@/types/UseTranslationsResult';

interface BusLinesColumnsFactoryProps {
  onDelete: (id: number) => void;
  tCommon: UseTranslationsResult;
  tBusLines: UseTranslationsResult;
}

export function busLinesColumnsFactory({
  onDelete,
  tCommon,
  tBusLines,
}: BusLinesColumnsFactoryProps): ColumnDef<bus_lines.BusLine>[] {
  return [
    {
      accessorKey: 'name',
      header: tCommon('fields.name'),
    },
    {
      accessorKey: 'code',
      header: tCommon('fields.code'),
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
      cell: ({ row }) => {
        const active = row.original.active;
        return <IsActiveBadge isActive={active} />;
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const record = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <Link href={routes.busLines.getDetailsRoute(record.id.toString())}>
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
                <Link href={routes.busLines.getEditRoute(record.id.toString())}>
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

export default function BusLinesTable() {
  const tCommon = useTranslations('common');
  const tBusLines = useTranslations('busLines');
  const { data, isLoading, error, refetch } = useQueryBusLines();
  const { deleteBusLine } = useBusLineMutations();
  const [deleteId, setDeleteId] = useState<number>();

  const onConfirmDelete = () => {
    if (!deleteId) return;
    deleteBusLine.mutateWithToast(deleteId);
    setDeleteId(undefined);
  };

  const columns = busLinesColumnsFactory({
    onDelete: setDeleteId,
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
      />
      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={() => setDeleteId(undefined)}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
