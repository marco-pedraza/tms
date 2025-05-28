'use client';

import {
  type ColumnDef,
  type Header,
  type HeaderGroup,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp, DatabaseIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SortBy } from '@/types/sort-by';
import DataTableEmpty from './data-table-empty';
import DataTableError from './data-table-error';
import DataTableHeader, { FilterConfig } from './data-table-header';
import DataTableLoading from './data-table-loading';
import DataTablePagination from './data-table-pagination';
import { FilterSelectOption } from './filter-select';

interface DataTablePagination extends PaginationState {
  pageCount?: number;
}

export type DataTableColumnDef<TData> = ColumnDef<TData> & {
  sortable?: boolean;
};

interface DataTableProps<TData extends object> {
  data: TData[];
  columns: DataTableColumnDef<TData>[];
  isLoading: boolean;
  errorMessage?: string;
  hasError: boolean;
  onRetry: () => void;
  addHref: string;
  pagination?: DataTablePagination;
  onPaginationChange?: OnChangeFn<PaginationState>;
  sorting?: SortBy<TData>;
  onSortingChange?: OnChangeFn<SortingState>;
  initialSearchValue?: string;
  onSearchChange?: (value: string) => void;
  filtersConfig?: FilterConfig[];
  filtersState?: Record<string, FilterSelectOption['value']>;
  onFiltersChange?: (
    value: Record<string, FilterSelectOption['value']>,
  ) => void;
}

export function DataTable<TData extends object>({
  data,
  columns,
  isLoading = false,
  errorMessage = '',
  hasError = false,
  onRetry,
  addHref,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  initialSearchValue = '',
  onSearchChange,
  filtersConfig = [],
  filtersState = {},
  onFiltersChange = () => {},
}: DataTableProps<TData>) {
  const sortingState: SortingState =
    sorting?.map((sort) => ({
      id: sort.field.toString(),
      desc: sort.direction === 'desc',
    })) ?? [];
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    state: {
      ...(pagination && { pagination }),
      ...(sortingState && { sorting: sortingState }),
    },
    onPaginationChange,
    pageCount: pagination?.pageCount,
    onSortingChange,
  });
  const tCommon = useTranslations('common');
  const hasFilters = Object.values(filtersState).length > 0;
  const hasSearch = initialSearchValue.length > 0;
  const isEmpty = !data.length && !hasFilters && !hasSearch;
  const resultsNotFound = !data.length && (hasFilters || hasSearch);

  if (hasError) {
    return (
      <DataTableError
        table={table}
        errorMessage={errorMessage}
        onRetry={onRetry}
        columnsCount={columns.length}
      />
    );
  }

  if (isLoading) {
    return <DataTableLoading columns={columns} table={table} />;
  }

  if (isEmpty) {
    return (
      <DataTableEmpty
        table={table}
        columnsCount={columns.length}
        addHref={addHref}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <DataTableHeader
        initialSearchValue={initialSearchValue}
        onSearchChange={onSearchChange}
        filtersConfig={filtersConfig}
        filtersState={filtersState}
        onFiltersChange={onFiltersChange}
      />
      <div className="w-full border rounded-md">
        <div className="relative">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                {table
                  .getHeaderGroups()
                  .map((headerGroup: HeaderGroup<TData>) => {
                    return (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map(
                          (header: Header<TData, unknown>) => {
                            const columnDef = header.column
                              .columnDef as DataTableColumnDef<TData>;
                            const direction = header.column.getIsSorted();
                            const isSortable = columnDef.sortable;
                            return (
                              <TableHead
                                key={header.id}
                                className={
                                  isSortable
                                    ? 'cursor-pointer select-none'
                                    : undefined
                                }
                                onClick={
                                  isSortable
                                    ? () => {
                                        const isDesc =
                                          header.column.getIsSorted() ===
                                          'desc';
                                        if (isDesc) {
                                          header.column.clearSorting();
                                        } else {
                                          header.column.toggleSorting(
                                            header.column.getIsSorted() ===
                                              'asc',
                                          );
                                        }
                                      }
                                    : undefined
                                }
                              >
                                <div className="flex items-center gap-1">
                                  <span>
                                    {header.isPlaceholder
                                      ? null
                                      : flexRender(
                                          header.column.columnDef.header,
                                          header.getContext(),
                                        )}
                                  </span>
                                  {isSortable ? (
                                    <div className="flex flex-col h-4 justify-center">
                                      {direction === 'asc' ? (
                                        <ChevronUp className="h-4 w-4" />
                                      ) : direction === 'desc' ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <div className="flex flex-col opacity-30">
                                          <ChevronUp className="h-3 w-3 -mb-1" />
                                          <ChevronDown className="h-3 w-3" />
                                        </div>
                                      )}
                                    </div>
                                  ) : null}
                                </div>
                              </TableHead>
                            );
                          },
                        )}
                      </TableRow>
                    );
                  })}
              </TableHeader>
              <TableBody>
                {resultsNotFound && (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center">
                      <div className="flex flex-col items-center justify-center py-12">
                        <DatabaseIcon className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-4">
                          {tCommon('table.not_results')}
                        </h3>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        {pagination && <DataTablePagination table={table} />}
      </div>
    </div>
  );
}
