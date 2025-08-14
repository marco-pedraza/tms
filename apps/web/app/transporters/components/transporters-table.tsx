'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { transporters } from '@repo/ims-client';
import useQueryAllCities from '@/app/cities/hooks/use-query-all-cities';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable, DataTableColumnDef } from '@/components/data-table';
import { FilterConfig } from '@/components/data-table/data-table-header';
import IsActiveBadge from '@/components/is-active-badge';
import useServerTableEvents from '@/hooks/use-server-table-events';
import useTableUrlState from '@/hooks/use-table-url-state';
import routes from '@/services/routes';
import useQueryTransporters from '@/transporters/hooks/use-query-transporters';
import useTransporterMutations from '@/transporters/hooks/use-transporter-mutations';
import type {
  UseCommonTranslationsResult,
  UseTransportersTranslationsResult,
} from '@/types/translations';

interface TransportersColumnsFactoryProps {
  tCommon: UseCommonTranslationsResult;
  tTransporters: UseTransportersTranslationsResult;
}

function transportersColumnsFactory({
  tCommon,
  tTransporters,
}: TransportersColumnsFactoryProps): DataTableColumnDef<transporters.TransporterWithCity>[] {
  return [
    {
      accessorKey: 'name',
      header: tCommon('fields.name'),
      sortable: true,
    },
    {
      accessorKey: 'code',
      header: tCommon('fields.code'),
      sortable: true,
    },
    {
      accessorKey: 'licenseNumber',
      header: tTransporters('fields.licenseNumber'),
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
      id: 'headquarterCityId',
      accessorKey: 'headquarterCity.name',
      header: tTransporters('fields.headquarterCity'),
      sortable: true,
    },
    {
      accessorKey: 'email',
      header: tCommon('fields.email'),
    },
    {
      accessorKey: 'phone',
      header: tCommon('fields.phone'),
    },
  ];
}

export default function TransportersTable() {
  const tCommon = useTranslations('common');
  const tTransporters = useTranslations('transporters');
  const {
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
    searchUrlState,
    setSearchUrlState,
    filtersUrlState,
    setFiltersUrlState,
  } = useTableUrlState<transporters.Transporter>();
  const { data, isLoading, error, refetch } = useQueryTransporters({
    page: paginationUrlState.page,
    pageSize: paginationUrlState.pageSize,
    searchTerm: searchUrlState,
    orderBy: sortingUrlState,
    filters: filtersUrlState,
  });
  const { onSortingChange, onPaginationChange } = useServerTableEvents({
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
  });
  const { data: cities } = useQueryAllCities();
  const { deleteTransporter } = useTransporterMutations();
  const [deleteId, setDeleteId] = useState<number>();

  const filtersConfig: FilterConfig[] = [
    {
      name: tCommon('fields.active'),
      key: 'active',
      options: [
        { label: tCommon('status.active'), value: true },
        { label: tCommon('status.inactive'), value: false },
      ],
    },
    {
      name: tTransporters('fields.headquarterCity'),
      key: 'headquarterCityId',
      options:
        cities?.data.map((city) => ({
          label: city.name,
          value: city.id,
        })) ?? [],
    },
  ];

  const onConfirmDelete = () => {
    if (!deleteId) return;
    deleteTransporter.mutateWithToast(deleteId);
    setDeleteId(undefined);
  };

  const columns = transportersColumnsFactory({
    tCommon,
    tTransporters,
  });

  return (
    <>
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        hasError={!!error}
        onRetry={refetch}
        addHref={routes.transporters.new}
        pagination={{
          pageIndex: paginationUrlState.page - 1,
          pageSize: paginationUrlState.pageSize,
          pageCount: data?.pagination.totalPages ?? 0,
        }}
        onSortingChange={onSortingChange}
        sorting={sortingUrlState}
        initialSearchValue={searchUrlState}
        onSearchChange={setSearchUrlState}
        filtersConfig={filtersConfig}
        filtersState={filtersUrlState}
        onFiltersChange={setFiltersUrlState}
        onPaginationChange={onPaginationChange}
        onDelete={setDeleteId}
        routes={routes.transporters}
      />
      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={() => setDeleteId(undefined)}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
