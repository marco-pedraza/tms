'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { terminals } from '@repo/ims-client';
import { DataTable } from '@/components/data-table';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import useQueryTerminals from '@/terminals/hooks/use-query-terminals';
import useTerminalMutations from '@/terminals/hooks/use-terminal-mutations';

type Terminal = terminals.Terminal;

interface TranslationObject {
  fields: {
    name: string;
    code: string;
    city: string;
    slug: string;
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

const terminalsColumnsFactory = (
  getViewHref: (id: string) => string,
  onDelete: (id: string) => void,
  onEdit: (id: string) => void,
  translations: TranslationObject,
): ColumnDef<Terminal>[] => {
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
      cell: ({ row }) => <div>{row.getValue('code')}</div>,
    },
    {
      accessorKey: 'slug',
      header: translations.fields.slug,
      cell: ({ row }) => <div>{row.getValue('slug')}</div>,
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

export default function TerminalsTable() {
  const tTerminals = useTranslations('terminals');
  const tCommon = useTranslations('common');

  const router = useRouter();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { deleteTerminal } = useTerminalMutations();

  const { data, isLoading, error, refetch } = useQueryTerminals();

  const handleDelete = (id: string) => {
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      console.error('Invalid terminal ID:', id);
      return;
    }
    setDeleteId(numericId);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteTerminal.mutateWithToast(deleteId);
    setDeleteId(null);
  };

  const getViewHref = (id: string) => {
    return `/terminals/${id}`;
  };

  const handleEdit = (id: string) => {
    router.push(`/terminals/${id}/edit`);
  };

  // Prepare translations object for the columns factory
  const translations: TranslationObject = {
    fields: {
      name: tCommon('fields.name'),
      code: tCommon('fields.code'),
      city: tTerminals('fields.city'),
      slug: tTerminals('fields.slug'),
      status: tCommon('fields.status'),
      createdAt: tCommon('fields.createdAt'),
      actions: tCommon('fields.actions'),
    },
    status: {
      active: tCommon('status.active'),
      inactive: tCommon('status.inactive'),
    },
    actions: {
      view: tCommon('actions.view'),
      edit: tCommon('actions.edit'),
      delete: tCommon('actions.delete'),
      more: tCommon('actions.more'),
    },
  };

  const columns = terminalsColumnsFactory(
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
        addHref="/terminals/new"
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
              {tCommon('crud.delete.confirm')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tCommon('crud.delete.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {tCommon('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
