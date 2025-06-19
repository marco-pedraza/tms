import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { bus_lines } from '@repo/ims-client';
import useBusLineMutations from '@/bus-lines/hooks/use-bus-line-mutations';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable, DataTableColumnDef } from '@/components/data-table';
import IsActiveBadge from '@/components/is-active-badge';
import routes from '@/services/routes';
import useQueryTransporterBusLines from '@/transporters/hooks/use-query-transporter-bus-lines';
import useTransporterDetailsParams from '@/transporters/hooks/use-transporter-details-params';
import { UseTranslationsResult } from '@/types/use-translation-result';

interface TransporterBusLinesColumnsFactoryProps {
  tCommon: UseTranslationsResult;
  tBusLines: UseTranslationsResult;
}

function transporterBusLinesColumnsFactory({
  tCommon,
  tBusLines,
}: TransporterBusLinesColumnsFactoryProps): DataTableColumnDef<bus_lines.BusLine>[] {
  return [
    {
      accessorKey: 'name',
      header: tCommon('fields.name'),
    },
    {
      accessorKey: 'code',
      header: tCommon('fields.code'),
    },
    {
      accessorKey: 'serviceTypeId',
      header: tBusLines('fields.serviceType'),
    },
    {
      accessorKey: 'active',
      header: tCommon('fields.active'),
      cell: ({ row }) => {
        const active = row.original.active;
        return <IsActiveBadge isActive={active} />;
      },
    },
  ];
}

export default function TransporterBusLinesTable() {
  const tCommon = useTranslations('common');
  const tBusLines = useTranslations('busLines');
  const { transporterId, isValidId } = useTransporterDetailsParams();
  const {
    data: busLines,
    isLoading,
    error,
    refetch,
  } = useQueryTransporterBusLines({
    transporterId,
    enabled: isValidId,
  });
  const { deleteBusLine } = useBusLineMutations();
  const [deleteId, setDeleteId] = useState<number>();

  const onConfirmDelete = () => {
    if (!deleteId) return;
    deleteBusLine.mutateWithToast(deleteId);
    setDeleteId(undefined);
  };

  const columns = transporterBusLinesColumnsFactory({
    tCommon,
    tBusLines,
  });

  return (
    <>
      <DataTable
        data={busLines ?? []}
        columns={columns}
        isLoading={isLoading}
        hasError={!!error}
        onRetry={refetch}
        addHref={routes.busLines.new}
        onDelete={setDeleteId}
        routes={routes.busLines}
      />
      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={() => setDeleteId(undefined)}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
