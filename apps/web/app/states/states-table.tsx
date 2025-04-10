'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

type State = states.State;

const statesColumnsFactory = (
  getViewHref: (id: string) => string,
  onDelete: (id: string) => void,
  onEdit: (id: string) => void,
  t: (key: string) => string,
): ColumnDef<State>[] => {
  return [
    {
      accessorKey: 'name',
      header: t('common:fields.name'),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'code',
      header: t('common:fields.code'),
    },
    {
      accessorKey: 'active',
      header: t('common:fields.status'),
      cell: ({ row }) => {
        const active = row.getValue('active');
        return active ? (
          <Badge variant="outline" className="bg-green-100">
            {t('common:status.active')}
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-red-100">
            {t('common:status.inactive')}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: t('common:fields.createdAt'),
      cell: ({ row }) => {
        return new Date(row.getValue('createdAt') ?? '').toLocaleDateString();
      },
    },
    {
      id: 'actions',
      header: t('common:fields.actions'),
      cell: ({ row }) => {
        const record = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <Link href={getViewHref(record.id.toString())}>
              <Button variant="ghost" size="sm">
                {t('common:actions.view')}
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">{t('common:actions.more')}</span>
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
                  {t('common:actions.edit')}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    onDelete(record.id.toString());
                  }}
                >
                  {t('common:actions.delete')}
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
  const { t } = useTranslation(['states', 'common']);
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

  const columns = statesColumnsFactory(
    getViewHref,
    handleDelete,
    handleEdit,
    t,
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
      <AlertDialog
        open={!!deleteId}
        onOpenChange={() => {
          setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('common:crud.delete.confirm')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('common:crud.delete.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {t('common:actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
