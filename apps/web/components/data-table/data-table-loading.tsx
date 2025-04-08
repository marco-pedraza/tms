import {
  ColumnDef,
  flexRender,
  Header,
  HeaderGroup,
  Table as TableType,
} from '@tanstack/react-table';
import {
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Table,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface DataTableLoadingProps<TData> {
  table: TableType<TData>;
  columns: ColumnDef<TData>[];
}

function DataTableLoading<TData>({
  table,
  columns,
}: DataTableLoadingProps<TData>) {
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
              {Array.from({
                length: table.getState().pagination.pageSize,
              }).map((_, index) => (
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

export default DataTableLoading;
