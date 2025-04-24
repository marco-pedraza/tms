'use client';

import {
  type ColumnDef,
  type Header,
  type HeaderGroup,
  type PaginationState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import DataTableEmpty from './data-table-empty';
import DataTableError from './data-table-error';
import DataTableLoading from './data-table-loading';
import DataTablePagination from './data-table-pagination';

interface DataTablePagination extends PaginationState {
  pageCount: number;
}

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  isLoading: boolean;
  errorMessage?: string;
  hasError: boolean;
  pagination?: DataTablePagination;
  initialPagination?: Partial<DataTablePagination>;
  onRetry: () => void;
  onAdd: () => void;
  onPreviousPage?: () => void;
  onNextPage?: () => void;
  onSetPageSize?: (pageSize: number) => void;
  onLastPage?: () => void;
  onFirstPage?: () => void;
}

export function DataTable<TData>({
  data,
  columns,
  isLoading = false,
  errorMessage = '',
  hasError = false,
  pagination,
  initialPagination,
  onRetry,
  onAdd,
  onPreviousPage,
  onNextPage,
  onSetPageSize,
  onLastPage,
  onFirstPage,
}: DataTableProps<TData>) {
  const manualPagination = Boolean(pagination);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination,
    state: {
      ...(pagination && { pagination }),
    },
    initialState: {
      pagination: {
        pageIndex: initialPagination?.pageIndex ?? 0,
        pageSize: initialPagination?.pageSize ?? 10,
      },
    },
    ...(pagination?.pageCount && { pageCount: pagination.pageCount }),
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
        onAdd={onAdd}
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
                .map((headerGroup: HeaderGroup<TData>) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(
                      (header: Header<TData, unknown>) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      ),
                    )}
                  </TableRow>
                ))}
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
