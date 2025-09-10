'use client';

import { useTranslations } from 'next-intl';
import type { chromatics } from '@repo/ims-client';
import useChromaticMutations from '@/chromatics/hooks/use-chromatic-mutations';
import useQueryChromatics from '@/chromatics/hooks/use-query-chromatics';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable, DataTableColumnDef } from '@/components/data-table';
import { FilterConfig } from '@/components/data-table/data-table-header';
import IsActiveBadge from '@/components/is-active-badge';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import useServerTableEvents from '@/hooks/use-server-table-events';
import useTableUrlState from '@/hooks/use-table-url-state';
import routes from '@/services/routes';
import {
  UseChromaticsTranslationsResult,
  UseCommonTranslationsResult,
} from '@/types/translations';

interface ChromaticsColumnsFactoryProps {
  tChromatics: UseChromaticsTranslationsResult;
  tCommon: UseCommonTranslationsResult;
}

const chromaticsColumnsFactory = ({
  tChromatics,
  tCommon,
}: ChromaticsColumnsFactoryProps): DataTableColumnDef<chromatics.Chromatic>[] => {
  return [
    {
      accessorKey: 'name',
      header: tChromatics('fields.name'),
      sortable: true,
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'description',
      header: tChromatics('fields.description'),
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

export default function ChromaticsTable() {
  const tChromatics = useTranslations('chromatics');
  const tCommon = useTranslations('common');
  const { delete: deleteChromatic } = useChromaticMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deleteChromatic.mutateWithToast,
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
  } = useTableUrlState<chromatics.Chromatic>();
  const { data, isLoading, error, refetch } = useQueryChromatics({
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

  const columns = chromaticsColumnsFactory({ tChromatics, tCommon });

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
        addHref={routes.chromatics.new}
        onDelete={setDeleteId}
        routes={routes.chromatics}
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
