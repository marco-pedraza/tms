import {
  Header,
  HeaderGroup,
  Table as TableType,
  flexRender,
} from '@tanstack/react-table';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DataTableErrorProps<TData> {
  table: TableType<TData>;
  errorMessage: string;
  onRetry: () => void;
  columnsCount: number;
}

function DataTableError<TData>({
  table,
  errorMessage,
  onRetry,
  columnsCount,
}: DataTableErrorProps<TData>) {
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
                <TableCell colSpan={columnsCount} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="rounded-full bg-red-50 p-3 mb-4">
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    </div>
                    <h3 className="text-lg font-medium">
                      No pudimos cargar los datos
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md">
                      {errorMessage}
                    </p>
                    {onRetry && (
                      <Button onClick={onRetry} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reintentar
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

export default DataTableError;
