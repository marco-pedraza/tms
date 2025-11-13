'use client';

import { useTranslations } from 'next-intl';
import type { departments } from '@repo/ims-client';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable, DataTableColumnDef } from '@/components/data-table';
import { FilterConfig } from '@/components/data-table/data-table-header';
import IsActiveBadge from '@/components/is-active-badge';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import useServerTableEvents from '@/hooks/use-server-table-events';
import useTableUrlState from '@/hooks/use-table-url-state';
import routes from '@/services/routes';
import type {
  UseCommonTranslationsResult,
  UseDepartmentsTranslationsResult,
} from '@/types/translations';
import useDepartmentMutations from '../hooks/use-department-mutations';
import useQueryDepartments from '../hooks/use-query-departments';

/**
 * Props for the departments columns factory function.
 */
interface DepartmentsColumnsFactoryProps {
  tCommon: UseCommonTranslationsResult;
  tDepartments: UseDepartmentsTranslationsResult;
}

/**
 * Factory function that creates column definitions for the departments table.
 *
 * @param props - Translation functions for common and departments scopes
 * @returns Array of column definitions for the departments table
 */
function departmentsColumnsFactory({
  tCommon,
  tDepartments,
}: DepartmentsColumnsFactoryProps): DataTableColumnDef<departments.Department>[] {
  return [
    {
      accessorKey: 'name',
      header: tDepartments('fields.name'),
      sortable: true,
      cell: ({ row }) => {
        return <div className="font-medium">{row.original.name}</div>;
      },
    },
    {
      accessorKey: 'code',
      header: tDepartments('fields.code'),
      sortable: true,
      cell: ({ row }) => {
        return <div className="text-muted-foreground">{row.original.code}</div>;
      },
    },
    {
      accessorKey: 'description',
      header: tDepartments('fields.description'),
      sortable: false,
      cell: ({ row }) => {
        return <div>{row.original.description || '-'}</div>;
      },
    },
    {
      accessorKey: 'isActive',
      header: tCommon('fields.status'),
      cell: ({ row }) => {
        return <IsActiveBadge isActive={row.original.isActive} />;
      },
      sortable: true,
    },
  ];
}

/**
 * Client-side table component for displaying and managing departments.
 * Provides pagination, sorting, filtering, search, and delete functionality.
 *
 * @returns The departments table component with integrated CRUD operations
 */
export function DepartmentsTable() {
  const tCommon = useTranslations('common');
  const tDepartments = useTranslations('departments');
  const {
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
    searchUrlState,
    setSearchUrlState,
    filtersUrlState,
    setFiltersUrlState,
  } = useTableUrlState<departments.Department>();
  const { data, isLoading, error, refetch } = useQueryDepartments({
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
  const { delete: deleteDepartment } = useDepartmentMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deleteDepartment.mutateWithToast,
    });

  const columns = departmentsColumnsFactory({
    tCommon,
    tDepartments,
  });

  const filtersConfig: FilterConfig[] = [
    {
      name: tCommon('fields.status'),
      key: 'isActive',
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
        addHref={routes.departments.new}
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
        onDelete={setDeleteId}
        routes={routes.departments}
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
