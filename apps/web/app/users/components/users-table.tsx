'use client';

import { useTranslations } from 'next-intl';
import type { users } from '@repo/ims-client';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable, DataTableColumnDef } from '@/components/data-table';
import { FilterConfig } from '@/components/data-table/data-table-header';
import IsActiveBadge from '@/components/is-active-badge';
import { Badge } from '@/components/ui/badge';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import useServerTableEvents from '@/hooks/use-server-table-events';
import useTableUrlState from '@/hooks/use-table-url-state';
import routes from '@/services/routes';
import type {
  UseCommonTranslationsResult,
  UseUsersTranslationsResult,
} from '@/types/translations';
import useQueryUsers from '@/users/hooks/use-query-users';
import useUserMutations from '@/users/hooks/use-user-mutations';

interface UsersColumnsFactoryProps {
  tCommon: UseCommonTranslationsResult;
  tUsers: UseUsersTranslationsResult;
}

function usersColumnsFactory({
  tCommon,
  tUsers,
}: UsersColumnsFactoryProps): DataTableColumnDef<users.SafeUser>[] {
  return [
    {
      accessorKey: 'username',
      header: tUsers('fields.username'),
      sortable: true,
      cell: ({ row }) => {
        const username = row.original.username;
        return <div className="font-medium">{username}</div>;
      },
    },
    {
      accessorKey: 'email',
      header: tCommon('fields.email'),
      sortable: true,
      cell: ({ row }) => {
        const email = row.original.email;
        return <div className="text-muted-foreground">{email}</div>;
      },
    },
    {
      accessorKey: 'fullName',
      header: tCommon('fields.fullName'),
      sortable: false,
      cell: ({ row }) => {
        const firstName = row.original.firstName;
        const lastName = row.original.lastName;
        return <div>{`${firstName} ${lastName}`}</div>;
      },
    },
    {
      accessorKey: 'position',
      header: tUsers('fields.position'),
      sortable: false,
      cell: ({ row }) => {
        const position = row.original.position;
        return <div>{position || '-'}</div>;
      },
    },
    {
      accessorKey: 'employeeId',
      header: tUsers('fields.employeeId'),
      sortable: true,
      cell: ({ row }) => {
        const employeeId = row.original.employeeId;
        return <div>{employeeId || '-'}</div>;
      },
    },
    {
      accessorKey: 'isSystemAdmin',
      header: tUsers('fields.role'),
      sortable: true,
      cell: ({ row }) => {
        const isSystemAdmin = row.original.isSystemAdmin;
        return (
          <Badge variant={isSystemAdmin ? 'default' : 'secondary'}>
            {isSystemAdmin ? tUsers('roles.admin') : tUsers('roles.user')}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'active',
      header: tCommon('fields.status'),
      cell: ({ row }) => {
        const active = row.original.active;
        return <IsActiveBadge isActive={active} />;
      },
      sortable: true,
    },
  ];
}

export default function UsersTable() {
  const tCommon = useTranslations('common');
  const tUsers = useTranslations('users');
  const {
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
    searchUrlState,
    setSearchUrlState,
    filtersUrlState,
    setFiltersUrlState,
  } = useTableUrlState<users.SafeUser>();
  const { data, isLoading, error, refetch } = useQueryUsers({
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
  const { delete: deleteUser } = useUserMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deleteUser.mutateWithToast,
    });

  const columns = usersColumnsFactory({
    tCommon,
    tUsers,
  });

  const filtersConfig: FilterConfig[] = [
    {
      name: tCommon('fields.status'),
      key: 'active',
      options: [
        { label: tCommon('status.active'), value: true },
        { label: tCommon('status.inactive'), value: false },
      ],
    },
    {
      name: tUsers('fields.role'),
      key: 'isSystemAdmin',
      options: [
        { label: tUsers('roles.admin'), value: true },
        { label: tUsers('roles.user'), value: false },
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
        addHref={routes.users.new}
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
        routes={routes.users}
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
