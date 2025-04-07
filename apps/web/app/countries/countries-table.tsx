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
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import type { countries } from '@repo/ims-client';
import { DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

type Country = countries.Country;

const countriesColumnsFactory = (
  onDelete: (id: string) => void,
  onEdit: (id: string) => void,
  onView: (id: string) => void,
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
          <Button
            key="view"
            variant="ghost"
            size="sm"
            onClick={() => onView(record.id.toString())}
          >
            View
          </Button>
          <Button
            key="edit"
            variant="ghost"
            size="sm"
            onClick={() => onEdit(record.id.toString())}
          >
            Edit
          </Button>
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
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['countries'],
    queryFn: async () => await client.inventory.listCountries({}),
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      // @todo implement delete
      setDeleteId(null);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/countries/${id}/edit`);
  };

  const handleView = (id: string) => {
    router.push(`/countries/${id}`);
  };

  const onAdd = () => {
    router.push('/countries/new');
  };

  const columns = countriesColumnsFactory(handleDelete, handleEdit, handleView);

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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              country and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
