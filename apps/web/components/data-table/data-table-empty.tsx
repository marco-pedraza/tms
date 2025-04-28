import {
  Header,
  HeaderGroup,
  Table as TableType,
  flexRender,
} from '@tanstack/react-table';
import { DatabaseIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DataTableEmptyProps<TData> {
  table: TableType<TData>;
  columnsCount: number;
  onAdd: () => void;
}

function DataTableEmpty<TData>({
  table,
  columnsCount,
  onAdd,
}: DataTableEmptyProps<TData>) {
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
                  <div className="flex flex-col items-center justify-center py-12">
                    <DatabaseIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-4">
                      No hay datos disponibles
                    </h3>
                    {onAdd && (
                      <Button onClick={onAdd} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar datos
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

export default DataTableEmpty;
