'use client';

import { useTranslations } from 'next-intl';
import type { technologies } from '@repo/ims-client';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable, DataTableColumnDef } from '@/components/data-table';
import { FilterConfig } from '@/components/data-table/data-table-header';
import IsActiveBadge from '@/components/is-active-badge';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import useServerTableEvents from '@/hooks/use-server-table-events';
import useTableUrlState from '@/hooks/use-table-url-state';
import routes from '@/services/routes';
import useQueryTechnologies from '@/technologies/hooks/use-query-technologies';
import useTechnologyMutations from '@/technologies/hooks/use-technology-mutations';
import {
  UseCommonTranslationsResult,
  UseTechnologiesTranslationsResult,
} from '@/types/translations';

interface TechnologiesColumnsFactoryProps {
  tTechnologies: UseTechnologiesTranslationsResult;
  tCommon: UseCommonTranslationsResult;
}

const technologiesColumnsFactory = ({
  tTechnologies,
  tCommon,
}: TechnologiesColumnsFactoryProps): DataTableColumnDef<technologies.Technology>[] => {
  return [
    {
      accessorKey: 'name',
      header: tTechnologies('fields.name'),
      sortable: true,
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'description',
      header: tTechnologies('fields.description'),
      sortable: true,
    },
    {
      accessorKey: 'provider',
      header: tTechnologies('fields.provider'),
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
};

/**
 * TechnologiesTable
 * Server-driven table for listing technologies with sorting, search, pagination, and delete flow.
 */
export default function TechnologiesTable() {
  const tTechnologies = useTranslations('technologies');
  const tCommon = useTranslations('common');
  const { delete: deleteTechnology } = useTechnologyMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deleteTechnology.mutateWithToast,
    });
  const {
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
    searchUrlState,
    setSearchUrlState,
    filtersUrlState,
    setFiltersUrlState,
  } = useTableUrlState<technologies.Technology>();
  const { data, isLoading, error, refetch } = useQueryTechnologies({
    page: paginationUrlState.page,
    pageSize: paginationUrlState.pageSize,
    orderBy: sortingUrlState,
    searchTerm: searchUrlState,
    filters: filtersUrlState,
  });
  const { onSortingChange, onPaginationChange } = useServerTableEvents({
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
  });

  const columns = technologiesColumnsFactory({ tTechnologies, tCommon });

  const filtersConfig: FilterConfig[] = [
    {
      name: tCommon('fields.status'),
      key: 'active',
      options: [
        { label: tCommon('status.active'), value: true },
        { label: tCommon('status.inactive'), value: false },
      ],
    },
  ];

  return (
    <>
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        hasError={!!error}
        onRetry={refetch}
        addHref={routes.technologies.new}
        onDelete={setDeleteId}
        routes={routes.technologies}
        pagination={{
          pageIndex: paginationUrlState.page - 1,
          pageSize: paginationUrlState.pageSize,
          pageCount: data?.pagination.totalPages ?? 0,
        }}
        onPaginationChange={onPaginationChange}
        sorting={sortingUrlState}
        onSortingChange={onSortingChange}
        initialSearchValue={searchUrlState}
        onSearchChange={setSearchUrlState}
        filtersConfig={filtersConfig}
        filtersState={filtersUrlState}
        onFiltersChange={setFiltersUrlState}
      />
      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
