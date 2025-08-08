'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import BusLineSkeleton from '@/bus-lines/components/bus-line-skeleton';
import useBusLineDetailsParams from '@/bus-lines/hooks/use-bus-line-details-params';
import useBusLineMutations from '@/bus-lines/hooks/use-bus-line-mutations';
import useQueryBusLine from '@/bus-lines/hooks/use-query-bus-line';
import ActionButtons from '@/components/action-buttons';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import routes from '@/services/routes';

export default function BusLinePage() {
  const tBusLines = useTranslations('busLines');
  const tCommon = useTranslations('common');
  const { busLineId, isValidId } = useBusLineDetailsParams();
  const { data: busLine, isLoading } = useQueryBusLine({
    busLineId,
    enabled: isValidId,
  });
  const { deleteBusLine } = useBusLineMutations();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteBusLine.mutateWithToast(busLineId);
    setIsDeleteDialogOpen(false);
  };

  if (isLoading) {
    return <BusLineSkeleton />;
  }

  if (!busLine) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={busLine.name}
        description={tBusLines('details.description')}
        backHref={routes.busLines.index}
      />

      <div className="flex justify-end mb-6">
        <ActionButtons
          editHref={routes.busLines.getEditRoute(busLine.id.toString())}
          onDelete={handleDelete}
          editLabel={tCommon('actions.edit')}
          deleteLabel={tCommon('actions.delete')}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{tCommon('sections.basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{tCommon('fields.name')}</dt>
              <dd>{busLine.name}</dd>

              <dt className="font-medium">{tCommon('fields.code')}</dt>
              <dd>{busLine.code}</dd>

              <dt className="font-medium">{tCommon('fields.description')}</dt>
              <dd>{busLine.description || '-'}</dd>

              <dt className="font-medium">{tBusLines('fields.transporter')}</dt>
              <dd>{busLine.transporterId}</dd>

              <dt className="font-medium">{tBusLines('fields.serviceType')}</dt>
              <dd>{busLine.serviceTypeId}</dd>

              <dt className="font-medium">{tCommon('fields.status')}</dt>
              <dd>
                {busLine.active ? (
                  <Badge variant="outline" className="bg-green-100">
                    {tCommon('status.active')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-100">
                    {tCommon('status.inactive')}
                  </Badge>
                )}
              </dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información adicional</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">Precio por kilómetro</dt>
              <dd>{busLine.pricePerKilometer}</dd>

              <dt className="font-medium">Tamaño de flota</dt>
              <dd>{busLine.fleetSize || '-'}</dd>

              <dt className="font-medium">{tCommon('fields.website')}</dt>
              <dd>{busLine.website || '-'}</dd>

              <dt className="font-medium">{tCommon('fields.email')}</dt>
              <dd>{busLine.email || '-'}</dd>

              <dt className="font-medium">{tCommon('fields.phone')}</dt>
              <dd>{busLine.phone || '-'}</dd>

              <dt className="font-medium">{tCommon('fields.createdAt')}</dt>
              <dd>{new Date(busLine.createdAt ?? '').toLocaleString()}</dd>

              <dt className="font-medium">{tCommon('fields.updatedAt')}</dt>
              <dd>{new Date(busLine.updatedAt ?? '').toLocaleString()}</dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
