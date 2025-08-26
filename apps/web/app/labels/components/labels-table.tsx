'use client';

import { useTranslations } from 'next-intl';
import type { labels } from '@repo/ims-client';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable, DataTableColumnDef } from '@/components/data-table';
import IsActiveBadge from '@/components/is-active-badge';
import { Badge } from '@/components/ui/badge';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import useServerTableEvents from '@/hooks/use-server-table-events';
import useTableUrlState from '@/hooks/use-table-url-state';
import useLabelMutations from '@/labels/hooks/use-label-mutations';
import useQueryLabels from '@/labels/hooks/use-query-labels';
import routes from '@/services/routes';
import type {
  UseCommonTranslationsResult,
  UseLabelsTranslationsResult,
} from '@/types/translations';

interface LabelsColumnsFactoryProps {
  tCommon: UseCommonTranslationsResult;
  tLabels: UseLabelsTranslationsResult;
}

function labelsColumnsFactory({
  tCommon,
  tLabels,
}: LabelsColumnsFactoryProps): DataTableColumnDef<labels.LabelWithNodeCount>[] {
  return [
    {
      accessorKey: 'name',
      header: tCommon('fields.name'),
      sortable: true,
      cell: ({ row }) => {
        const name = row.original.name;
        const color = row.original.color;
        return (
          <Badge
            variant="outline"
            style={{
              backgroundColor: `${color}20`, // 20% opacity for subtle background
              borderColor: color,
              color: color,
            }}
          >
            {name}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'description',
      header: tCommon('fields.description'),
      sortable: false,
      cell: ({ row }) => {
        const description = row.original.description;
        return <div>{description}</div>;
      },
    },
    {
      accessorKey: 'color',
      header: tCommon('fields.color'),
      sortable: false,
      cell: ({ row }) => {
        const color = row.original.color;
        return (
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border border-gray-300"
              style={{ backgroundColor: color }}
            />
            <span className="font-mono text-sm text-muted-foreground">
              {color}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'nodeCount',
      header: tCommon('fields.usageCount'),
      sortable: false,
      cell: ({ row }) => {
        const count = row.original.nodeCount;
        const nodeText =
          count === 1 ? tLabels('nodeCount.nodo') : tLabels('nodeCount.nodos');
        return (
          <div>
            {count} {nodeText}
          </div>
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

export default function LabelsTable() {
  const tCommon = useTranslations('common');
  const tLabels = useTranslations('labels');
  const {
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
    searchUrlState,
    setSearchUrlState,
  } = useTableUrlState<labels.Label>();
  const { data, isLoading, error, refetch } = useQueryLabels({
    page: paginationUrlState.page,
    pageSize: paginationUrlState.pageSize,
    orderBy: sortingUrlState,
    searchTerm: searchUrlState,
    filters: {},
  });
  const { onSortingChange, onPaginationChange } = useServerTableEvents({
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
  });
  const { delete: deleteLabel } = useLabelMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deleteLabel.mutateWithToast,
    });

  const columns = labelsColumnsFactory({
    tCommon,
    tLabels,
  });

  return (
    <>
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        hasError={!!error}
        onRetry={refetch}
        addHref={routes.labels.new}
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
        routes={routes.labels}
      />
      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
