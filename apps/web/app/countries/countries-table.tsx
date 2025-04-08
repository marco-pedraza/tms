'use client';

import { useState } from 'react';
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
): ColumnDef<Country>[] => [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('name')}</div>
    ),
  },
  {
    accessorKey: 'code',
    header: 'Code',
  },
  {
    accessorKey: 'active',
    header: 'Status',
    cell: ({ row }) => {
      const active = row.getValue('active');
      return active ? (
        <Badge variant="outline" className="bg-green-100">
          Active
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-red-100">
          Inactive
        </Badge>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => {
      return new Date(row.getValue('createdAt') ?? '').toLocaleDateString();
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="flex items-center justify-end gap-2">
          <Link href={getViewHref(record.id.toString())}>
            <Button variant="ghost" size="sm">
              View
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => onEdit(record.id.toString())}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => onDelete(record.id.toString())}
              >
                Delete
              </Button>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

export default function CountriesTable() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['countries'],
    queryFn: async () => await client.inventory.listCountries({}),
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const deleteCountryMutation = useMutation({
    mutationFn: async (id: number) => await client.inventory.deleteCountry(id),
    onSuccess: () => {
      toast.success('País eliminado correctamente');
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error('No pudimos eliminar el país', {
        description: error.message,
      });
      setDeleteId(null);
    },
  });

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteCountryMutation.mutate(parseInt(deleteId, 10));
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
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el
              país y todos los datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
