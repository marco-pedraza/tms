'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { bus_lines } from '@repo/ims-client';
import { DataTable, DataTableColumnDef } from '@/components/data-table';
import IsActiveBadge from '@/components/is-active-badge';
import { Button } from '@/components/ui/button';
import routes from '@/services/routes';
import useQueryTransporterBusLines from '@/transporters/hooks/use-query-transporter-bus-lines';
import {
  UseBusLinesTranslationsResult,
  UseCommonTranslationsResult,
} from '@/types/translations';

interface TransporterBusLinesTableProps {
  transporterId: number;
}

interface BusLinesColumnsFactoryProps {
  tCommon: UseCommonTranslationsResult;
  tBusLines: UseBusLinesTranslationsResult;
}

function busLinesColumnsFactory({
  tCommon,
}: BusLinesColumnsFactoryProps): DataTableColumnDef<bus_lines.BusLine>[] {
  return [
    {
      accessorKey: 'name',
      header: tCommon('fields.name'),
      sortable: false,
    },
    {
      accessorKey: 'code',
      header: tCommon('fields.code'),
      sortable: false,
    },

    {
      accessorKey: 'active',
      header: tCommon('fields.status'),
      sortable: false,
      cell: ({ row }) => {
        const active = row.getValue('active') as boolean;
        return <IsActiveBadge isActive={active} />;
      },
    },
    {
      id: 'actions',
      header: tCommon('fields.actions'),
      sortable: false,
      cell: ({ row }) => {
        const busLine = row.original;
        return (
          <div className="flex justify-center">
            <Link href={routes.busLines.getDetailsRoute(busLine.id.toString())}>
              <Button variant="ghost" size="sm">
                {tCommon('actions.view')}
              </Button>
            </Link>
          </div>
        );
      },
    },
  ];
}

export default function TransporterBusLinesTable({
  transporterId,
}: TransporterBusLinesTableProps) {
  const tCommon = useTranslations('common');
  const tBusLines = useTranslations('busLines');

  const { data, isLoading, error, refetch } = useQueryTransporterBusLines({
    transporterId,
    active: true, // Only show active bus lines by default
  });

  const columns = busLinesColumnsFactory({ tCommon, tBusLines });

  return (
    <DataTable<bus_lines.BusLine>
      data={data?.data ?? []}
      columns={columns}
      isLoading={isLoading}
      hasError={!!error}
      onRetry={refetch}
      addHref={`${routes.busLines.new}?transporterId=${transporterId}`}
      routes={routes.busLines}
      displayActionsColumn={false}
      onDelete={() => {
        // We don't need to delete at this point
      }}
    />
  );
}
