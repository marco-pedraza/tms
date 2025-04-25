'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import client from '@/lib/imsClient';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import type { states } from '@repo/ims-client';
import { DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStateMutations } from '@/app/states/hooks/use-state-mutations';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';

type State = states.State;

interface CommonTranslations {
  fields: {
    name: string;
    code: string;
    status: string;
    createdAt: string;
    actions: string;
  };
  status: {
    active: string;
    inactive: string;
  };
  actions: {
    view: string;
    edit: string;
    delete: string;
    more: string;
  };
}

const statesColumnsFactory = (
  getViewHref: (id: string) => string,
  onDelete: (id: string) => void,
  onEdit: (id: string) => void,
  translations: CommonTranslations,
): ColumnDef<State>[] => {
  return [
    {
      accessorKey: 'name',
      header: translations.fields.name,
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'code',
      header: translations.fields.code,
    },
    {
      accessorKey: 'active',
      header: translations.fields.status,
      cell: ({ row }) => {
        const active = row.getValue('active');
        return active ? (
          <Badge variant="outline" className="bg-green-100">
            {translations.status.active}
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-red-100">
            {translations.status.inactive}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: translations.fields.createdAt,
      cell: ({ row }) => {
        const value = row.getValue('createdAt');
        return value ? new Date(value as string).toLocaleDateString() : '-';
      },
    },
    {
      id: 'actions',
      header: translations.fields.actions,
      cell: ({ row }) => {
        const record = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <Link href={getViewHref(record.id.toString())}>
              <Button variant="ghost" size="sm">
                {translations.actions.view}
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">{translations.actions.more}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    onEdit(record.id.toString());
                  }}
                >
                  {translations.actions.edit}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    onDelete(record.id.toString());
                  }}
                >
                  {translations.actions.delete}
                </Button>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
};

export default function StatesTable() {
  const t = useTranslations('common');

  const router = useRouter();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { deleteState } = useStateMutations();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['states'],
    queryFn: async () => await client.inventory.listStatesPaginated({}),
  });

  const handleDelete = (id: string) => {
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      console.error('Invalid state ID:', id);
      return;
    }
    setDeleteId(numericId);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteState.mutateWithToast(deleteId);
    setDeleteId(null);
  };

  const getViewHref = (id: string) => {
    return `/states/${id}`;
  };

  const handleEdit = (id: string) => {
    router.push(`/states/${id}/edit`);
  };

  const onAdd = () => {
    router.push('/states/new');
  };

  // Prepare translations object for the columns factory only
  const translations: CommonTranslations = {
    fields: {
      name: t('fields.name'),
      code: t('fields.code'),
      status: t('fields.status'),
      createdAt: t('fields.createdAt'),
      actions: t('fields.actions'),
    },
    status: {
      active: t('status.active'),
      inactive: t('status.inactive'),
    },
    actions: {
      view: t('actions.view'),
      edit: t('actions.edit'),
      delete: t('actions.delete'),
      more: t('actions.more'),
    },
  };

  const columns = statesColumnsFactory(
    getViewHref,
    handleDelete,
    handleEdit,
    translations,
  );

  return (
    <>
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        hasError={!!error}
        onRetry={refetch}
        onAdd={onAdd}
      />
      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
