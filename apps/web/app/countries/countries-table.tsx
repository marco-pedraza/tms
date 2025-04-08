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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import type { countries } from '@repo/ims-client';
import { DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type Country = countries.Country;

const countriesColumnsFactory = (
  getViewHref: (id: string) => string,
  onDelete: (id: string) => void,
  onEdit: (id: string) => void,
  t: (key: string) => string,
): ColumnDef<Country>[] => {
  return [
    {
      accessorKey: 'name',
      header: t('form.name'),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'code',
      header: t('form.code'),
    },
    {
      accessorKey: 'active',
      header: t('form.status'),
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
                  onClick={() => onEdit(record.id.toString())}
                >
                  {t('common:actions.edit')}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => onDelete(record.id.toString())}
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

export default function CountriesTable() {
  const { t } = useTranslation(['countries', 'common']);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['countries'],
    queryFn: async () => await client.inventory.listCountries({}),
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const deleteCountryMutation = useMutation({
    mutationFn: async (id: number) => {
      const result = await client.inventory.deleteCountry(id);
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      setDeleteId(null);
      return result;
    },
  });

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      toast.promise(deleteCountryMutation.mutateAsync(parseInt(deleteId, 10)), {
        loading: t('messages.delete.loading'),
        success: t('messages.delete.success'),
        error: t('messages.delete.error'),
      });
    }
  };

  const getViewHref = (id: string) => {
    return `/countries/${id}`;
  };

  const handleEdit = (id: string) => {
    router.push(`/countries/${id}/edit`);
  };

  const onAdd = () => {
    router.push('/countries/new');
  };

  const columns = countriesColumnsFactory(
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
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('messages.delete.confirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('messages.delete.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {t('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
