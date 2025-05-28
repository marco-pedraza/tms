'use client';

import {
  type ColumnDef,
  type Header,
  type HeaderGroup,
  OnChangeFn,
  type PaginationState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronDown } from 'lucide-react';
import { ChevronUp } from 'lucide-react';
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
import DataTableLoading from './data-table-loading';
import DataTablePagination from './data-table-pagination';

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
  pagination?: DataTablePagination;
  sorting?: SortBy<TData>;
  initialPagination?: Partial<DataTablePagination>;
  onRetry: () => void;
  onPreviousPage?: () => void;
  onNextPage?: () => void;
  onSetPageSize?: (pageSize: number) => void;
  onLastPage?: () => void;
  onFirstPage?: () => void;
  addHref: string;
  onPaginationChange?: OnChangeFn<PaginationState>;
  onSortingChange?: OnChangeFn<SortingState>;
}

export function DataTable<TData extends object>({
  data,
  columns,
  isLoading = false,
  errorMessage = '',
  hasError = false,
  pagination,
  initialPagination,
  onRetry,
  onPreviousPage,
  onNextPage,
  onSetPageSize,
  onLastPage,
  onFirstPage,
  addHref,
  onPaginationChange,
  onSortingChange,
  sorting,
}: DataTableProps<TData>) {
  const manualPagination = Boolean(pagination?.pageCount);
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
    manualPagination,
    state: {
      ...(pagination && { pagination }),
      ...(sortingState && { sorting: sortingState }),
    },
    onPaginationChange,
    initialState: {
      pagination: {
        pageIndex: initialPagination?.pageIndex ?? 0,
        pageSize: initialPagination?.pageSize ?? 10,
      },
      ...(sortingState && { sorting: sortingState }),
    },
    pageCount: pagination?.pageCount,
    onSortingChange,
  });
  const handleSetPageSize = (pageSize: number) => {
    if (manualPagination && onSetPageSize) {
      onSetPageSize(pageSize);
    } else {
      table.setPageSize(pageSize);
    }
  };

  const handlePreviousPage = () => {
    if (manualPagination && onPreviousPage) {
      onPreviousPage();
    } else {
      table.previousPage();
    }
  };

  const handleNextPage = () => {
    if (manualPagination && onNextPage) {
      onNextPage();
    } else {
      table.nextPage();
    }
  };

  const handleLastPage = () => {
    if (manualPagination && onLastPage) {
      onLastPage();
    } else {
      table.setPageIndex(table.getPageCount() - 1);
    }
  };

  const handleFirstPage = () => {
    if (manualPagination && onFirstPage) {
      onFirstPage();
    } else {
      table.setPageIndex(0);
    }
  };

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

  const isEmpty = !data.length;
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
                                        header.column.getIsSorted() === 'desc';
                                      if (isDesc) {
                                        header.column.clearSorting();
                                      } else {
                                        header.column.toggleSorting(
                                          header.column.getIsSorted() === 'asc',
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
      <DataTablePagination
        table={table}
        handleSetPageSize={handleSetPageSize}
        handleFirstPage={handleFirstPage}
        handleLastPage={handleLastPage}
        handlePreviousPage={handlePreviousPage}
        handleNextPage={handleNextPage}
      />
    </div>
  );
}
