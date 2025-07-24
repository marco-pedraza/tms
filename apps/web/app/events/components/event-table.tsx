'use client';

import { formatDuration } from 'date-fns';
import { useTranslations } from 'next-intl';
import { event_types } from '@repo/ims-client';
import AffirmationBadge from '@/components/affirmation-badge';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable, DataTableColumnDef } from '@/components/data-table';
import { FilterConfig } from '@/components/data-table/data-table-header';
import IsActiveBadge from '@/components/is-active-badge';
import useEventMutations from '@/events/hooks/use-event-mutations';
import useQueryEvents from '@/events/hooks/use-query-events';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import useServerTableEvents from '@/hooks/use-server-table-events';
import useTableUrlState from '@/hooks/use-table-url-state';
import routes from '@/services/routes';
import type {
  UseCommonTranslationsResult,
  UseEventsTranslationsResult,
} from '@/types/translations';

interface EventsColumnsFactoryProps {
  tCommon: UseCommonTranslationsResult;
  tEvents: UseEventsTranslationsResult;
}

function EventsColumnsFactory({
  tCommon,
  tEvents,
}: EventsColumnsFactoryProps): DataTableColumnDef<event_types.EventType>[] {
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
      accessorKey: 'description',
      header: tEvents('fields.description'),
    },
    {
      accessorKey: 'baseTime',
      header: tEvents('fields.baseTime'),
      cell: ({ row }) => {
        const value = row.original.baseTime;
        return <span>{formatDuration({ minutes: value })}</span>;
      },
    },
    {
      accessorKey: 'integration',
      header: tEvents('fields.integration'),
      cell: ({ row }) => {
        const value = row.original.integration;
        return <AffirmationBadge value={value} />;
      },
    },
    {
      accessorKey: 'needsCost',
      header: tEvents('fields.needsCost'),
      cell: ({ row }) => {
        const value = row.original.needsCost;
        return <AffirmationBadge value={value} />;
      },
    },
    {
      accessorKey: 'needsQuantity',
      header: tEvents('fields.needsQuantity'),
      cell: ({ row }) => {
        const value = row.original.needsQuantity;
        return <AffirmationBadge value={value} />;
      },
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

export default function EventsTable() {
  const tCommon = useTranslations('common');
  const tEvents = useTranslations('eventTypes');
  const {
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
    searchUrlState,
    setSearchUrlState,
    filtersUrlState,
    setFiltersUrlState,
  } = useTableUrlState<event_types.EventType>();
  const { data, isLoading, error, refetch } = useQueryEvents({
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
  const { delete: deleteEvent } = useEventMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deleteEvent.mutateWithToast,
    });

  const columns = EventsColumnsFactory({
    tCommon,
    tEvents,
  });

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
      name: tEvents('fields.integration'),
      key: 'integration',
      options: [
        { label: tEvents('filters.withIntegration'), value: true },
        { label: tEvents('filters.withoutIntegration'), value: false },
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
        addHref={routes.events.new}
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
        routes={routes.events}
      />
      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
