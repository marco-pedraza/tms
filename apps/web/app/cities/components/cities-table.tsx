'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cities } from '@repo/ims-client';
import useCityMutations from '@/cities/hooks/use-city-mutations';
import useQueryCities from '@/cities/hooks/use-query-cities';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable, DataTableColumnDef } from '@/components/data-table';
import IsActiveBadge from '@/components/is-active-badge';
import useServerTableEvents from '@/hooks/use-server-table-events';
import useTableUrlState from '@/hooks/use-table-url-state';
import routes from '@/services/routes';
import { UseTranslationsResult } from '@/types/use-translation-result';

interface CitiesColumnsFactoryProps {
  tCommon: UseTranslationsResult;
  tCities: UseTranslationsResult;
}

const citiesColumnsFactory = ({
  tCommon,
  tCities,
}: CitiesColumnsFactoryProps): DataTableColumnDef<cities.City>[] => {
  return [
    {
      accessorKey: 'name',
      header: tCommon('fields.name'),
      sortable: true,
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'slug',
      header: tCommon('fields.slug'),
      sortable: true,
      cell: ({ row }) => <div>{row.getValue('slug')}</div>,
    },
    {
      accessorKey: 'timezone',
      header: tCities('fields.timezone'),
      cell: ({ row }) => <div>{row.getValue('timezone')}</div>,
    },
    {
      accessorKey: 'active',
      header: tCommon('fields.status'),
      sortable: true,
      cell: ({ row }) => {
        const active = row.original.active;
        return <IsActiveBadge isActive={active} />;
      },
    },
    {
      accessorKey: 'createdAt',
      header: tCommon('fields.createdAt'),
      sortable: true,
      cell: ({ row }) => {
        const value = row.getValue('createdAt');
        return value ? new Date(value as string).toLocaleDateString() : '-';
      },
    },
  ];
};

export default function CitiesTable() {
  const tCities = useTranslations('cities');
  const tCommon = useTranslations('common');
  const [deleteId, setDeleteId] = useState<number>();
  const { deleteCity } = useCityMutations();
  const {
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
  } = useTableUrlState<cities.City>();
  const { data, isLoading, error, refetch } = useQueryCities({
    page: paginationUrlState.page,
    pageSize: paginationUrlState.pageSize,
    orderBy: sortingUrlState,
    searchTerm: '',
    filters: {},
  });
  const { onSortingChange, onPaginationChange } = useServerTableEvents({
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
  });

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteCity.mutateWithToast(deleteId);
    setDeleteId(undefined);
  };

  const columns = citiesColumnsFactory({ tCommon, tCities });

  return (
    <>
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        hasError={!!error}
        onRetry={refetch}
        addHref={routes.cities.new}
        pagination={{
          pageIndex: paginationUrlState.page - 1,
          pageSize: paginationUrlState.pageSize,
          pageCount: data?.pagination.totalPages ?? 0,
        }}
        onPaginationChange={onPaginationChange}
        sorting={sortingUrlState}
        onSortingChange={onSortingChange}
        onDelete={setDeleteId}
        routes={routes.cities}
      />
      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={() => {
          setDeleteId(undefined);
        }}
        onConfirm={confirmDelete}
      />
    </>
  );
}
