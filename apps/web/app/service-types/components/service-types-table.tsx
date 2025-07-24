'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { service_types } from '@repo/ims-client';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable, DataTableColumnDef } from '@/components/data-table';
import IsActiveBadge from '@/components/is-active-badge';
import useServerTableEvents from '@/hooks/use-server-table-events';
import useTableUrlState from '@/hooks/use-table-url-state';
import useQueryServiceTypes from '@/service-types/hooks/use-query-service-types';
import useServiceTypeMutations from '@/service-types/hooks/use-service-type-mutations';
import routes from '@/services/routes';
import {
  UseCommonTranslationsResult,
  UseServiceTypesTranslationsResult,
} from '@/types/translations';

interface ServiceTypesColumnsFactoryProps {
  tCommon: UseCommonTranslationsResult;
  tServiceTypes: UseServiceTypesTranslationsResult;
}

function serviceTypesColumnsFactory({
  tCommon,
  tServiceTypes,
}: ServiceTypesColumnsFactoryProps): DataTableColumnDef<service_types.ServiceType>[] {
  return [
    {
      accessorKey: 'name',
      header: tServiceTypes('fields.name'),
      sortable: true,
    },
    {
      accessorKey: 'description',
      header: tServiceTypes('fields.description'),
      sortable: true,
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
  ];
}

export default function ServiceTypesTable() {
  const tCommon = useTranslations('common');
  const tServiceTypes = useTranslations('serviceTypes');
  const {
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
  } = useTableUrlState<service_types.ServiceType>();
  const { data, isLoading, error, refetch } = useQueryServiceTypes({
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
  const { deleteServiceType } = useServiceTypeMutations();
  const [deleteId, setDeleteId] = useState<number>();

  const onConfirmDelete = () => {
    if (!deleteId) return;
    deleteServiceType.mutateWithToast(deleteId);
    setDeleteId(undefined);
  };

  const columns = serviceTypesColumnsFactory({ tCommon, tServiceTypes });

  return (
    <>
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        hasError={!!error}
        onRetry={refetch}
        addHref={routes.serviceTypes.new}
        onDelete={setDeleteId}
        routes={routes.serviceTypes}
        pagination={{
          pageIndex: paginationUrlState.page - 1,
          pageSize: paginationUrlState.pageSize,
          pageCount: data?.pagination.totalPages ?? 0,
        }}
        onPaginationChange={onPaginationChange}
        sorting={sortingUrlState}
        onSortingChange={onSortingChange}
      />
      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={() => setDeleteId(undefined)}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
