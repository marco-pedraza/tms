'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import client from '@/lib/ims-client';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import type { cities } from '@repo/ims-client';
import { DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCityMutations } from '@/app/cities/hooks/use-city-mutations';

type City = cities.City;

interface TranslationObject {
  fields: {
    name: string;
    slug: string;
    timezone: string;
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

const citiesColumnsFactory = (
  getViewHref: (id: string) => string,
  onDelete: (id: string) => void,
  onEdit: (id: string) => void,
  translations: TranslationObject,
): ColumnDef<City>[] => {
  return [
    {
      accessorKey: 'name',
      header: translations.fields.name,
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'slug',
      header: translations.fields.slug,
      cell: ({ row }) => <div>{row.getValue('slug')}</div>,
    },
    {
      accessorKey: 'timezone',
      header: translations.fields.timezone,
      cell: ({ row }) => <div>{row.getValue('timezone')}</div>,
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
        return new Date(row.getValue('createdAt') ?? '').toLocaleDateString();
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

export default function CitiesTable() {
  const tCities = useTranslations('cities');
  const tCommon = useTranslations('common');

  const router = useRouter();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { deleteCity } = useCityMutations();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => await client.inventory.listCitiesPaginated({}),
  });

  const handleDelete = (id: string) => {
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      console.error('Invalid city ID:', id);
      return;
    }
    setDeleteId(numericId);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteCity.mutateWithToast(deleteId);
    setDeleteId(null);
  };

  const getViewHref = (id: string) => {
    return `/cities/${id}`;
  };

  const handleEdit = (id: string) => {
    router.push(`/cities/${id}/edit`);
  };

  const onAdd = () => {
    router.push('/cities/new');
  };

  // Prepare translations object for the columns factory
  const translations: TranslationObject = {
    fields: {
      name: tCommon('fields.name'),
      slug: tCommon('fields.slug'),
      timezone: tCities('fields.timezone'),
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

  const columns = citiesColumnsFactory(
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
        onOpenChange={() => {
          setDeleteId(null);
        }}
        onConfirm={confirmDelete}
      />
    </>
  );
}
