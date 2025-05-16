import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { busLinesColumnsFactory } from '@/bus-lines/components/bus-lines-table';
import useBusLineMutations from '@/bus-lines/hooks/use-bus-line-mutations';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable } from '@/components/data-table';
import routes from '@/services/routes';
import useQueryTransporterBusLines from '@/transporters/hooks/use-query-transporter-bus-lines';
import useTransporterDetailsParams from '@/transporters/hooks/use-transporter-details-params';

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
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const onConfirmDelete = () => {
    if (!deleteId) return;
    deleteBusLine.mutateWithToast(deleteId);
    setDeleteId(null);
  };

  const columns = busLinesColumnsFactory({
    onDelete: setDeleteId,
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
      />
      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
