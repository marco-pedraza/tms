'use client';

import { type ReactNode } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type Header,
  type HeaderGroup,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, DatabaseIcon, RefreshCw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  actions?: (record: TData) => ReactNode[];
  moreActions?: (record: TData) => ReactNode;
  isLoading?: boolean;
  errorMessage?: string;
  hasError?: boolean;
  onRetry?: () => void;
  onAdd?: () => void;
  pageSize?: number;
}

export function DataTable<TData>({
  data,
  columns,
  isLoading = false,
  errorMessage = 'An error occurred while loading data',
  hasError = false,
  onRetry,
  onAdd,
  pageSize = 10,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  // Handle error state
  if (hasError) {
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
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-64 text-center"
                  >
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="rounded-full bg-red-50 p-3 mb-4">
                        <AlertCircle className="h-6 w-6 text-red-500" />
                      </div>
                      <h3 className="text-lg font-medium">
                        Error loading data
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md">
                        {errorMessage}
                      </p>
                      {onRetry && (
                        <Button onClick={onRetry} variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retry
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  }

  // Handle loading state
  if (isLoading) {
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
                {Array.from({ length: pageSize }).map((_, index) => (
                  <TableRow key={index}>
                    {columns.map((_, colIndex) => (
                      <TableCell key={`loading-${index}-${colIndex}`}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  }

  // Handle empty state
  if (data.length === 0) {
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
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-64 text-center"
                  >
                    <div className="flex flex-col items-center justify-center py-12">
                      <DatabaseIcon className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No data available</h3>
                      <p className="text-sm text-muted-foreground mt-1 mb-4">
                        There are no items to display at this time.
                      </p>
                      {onAdd && (
                        <Button onClick={onAdd} size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  }

  // Handle normal state with data
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
      <div className="flex items-center justify-between px-4 py-4 border-t">
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
