'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { service_types } from '@repo/ims-client';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import useQueryServiceTypes from '@/service-types/hooks/use-query-service-types';
import useServiceTypeMutations from '@/service-types/hooks/use-service-type-mutations';
import routes from '@/services/routes';

function serviceTypesColumnsFactory({
  onDelete,
  viewLabel,
  editLabel,
  deleteLabel,
  moreLabel,
  nameLabel,
  descriptionLabel,
  activeLabel,
  statusActive,
  statusInactive,
}: {
  onDelete: (id: number) => void;
  viewLabel: string;
  editLabel: string;
  deleteLabel: string;
  moreLabel: string;
  nameLabel: string;
  descriptionLabel: string;
  activeLabel: string;
  statusActive: string;
  statusInactive: string;
}): ColumnDef<service_types.ServiceType>[] {
  return [
    {
      accessorKey: 'name',
      header: nameLabel,
    },
    {
      accessorKey: 'description',
      header: descriptionLabel,
    },
    {
      accessorKey: 'active',
      header: activeLabel,
      cell: ({ row }) => {
        const active = row.getValue('active');
        return active ? (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            {statusActive}
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            {statusInactive}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const record = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <Link
              href={routes.serviceTypes.getDetailsRoute(record.id.toString())}
            >
              <Button variant="ghost" size="sm">
                {viewLabel}
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">{moreLabel}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link
                  href={routes.serviceTypes.getEditRoute(record.id.toString())}
                >
                  <Button variant="ghost" className="w-full justify-start">
                    {editLabel}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700"
                  onClick={() => onDelete(record.id)}
                >
                  {deleteLabel}
                </Button>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}

export default function ServiceTypesTable() {
  const tCommon = useTranslations('common');
  const tServiceTypes = useTranslations('serviceTypes');

  const { data, isLoading, error, refetch } = useQueryServiceTypes();
  const { deleteServiceType } = useServiceTypeMutations();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const onConfirmDelete = () => {
    if (!deleteId) return;
    deleteServiceType.mutateWithToast(deleteId);
    setDeleteId(null);
  };

  const columns = serviceTypesColumnsFactory({
    onDelete: setDeleteId,
    viewLabel: tCommon('actions.view'),
    editLabel: tCommon('actions.edit'),
    deleteLabel: tCommon('actions.delete'),
    moreLabel: tCommon('actions.more'),
    nameLabel: tServiceTypes('fields.name'),
    descriptionLabel: tServiceTypes('fields.description'),
    activeLabel: tServiceTypes('fields.active'),
    statusActive: tCommon('status.active'),
    statusInactive: tCommon('status.inactive'),
  });

  return (
    <>
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        hasError={!!error}
        onRetry={refetch}
        addHref={routes.serviceTypes.new}
      />
      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
