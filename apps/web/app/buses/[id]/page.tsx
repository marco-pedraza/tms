'use client';

import { useTranslations } from 'next-intl';
import useQuerySeatDiagram from '@/app/seat-diagrams/hooks/use-query-seat-diagram';
import BusSkeleton from '@/buses/components/bus-skeleton';
import BusStatusBadge from '@/buses/components/bus-status-badge';
import useBusMutations from '@/buses/hooks/use-bus-mutations';
import useQueryBus from '@/buses/hooks/use-query-bus';
import ActionButtons from '@/components/action-buttons';
import AffirmationBadge from '@/components/affirmation-badge';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DriverCard from '@/components/ui/driver-card';
import TechnologyCard from '@/components/ui/technology-card';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import routes from '@/services/routes';
import {
  parseAndFormatDateForHumans,
  parseAndFormatDateForHumansRelative,
} from '@/utils/date';
import busLicensePlateTypesTranslationKeys from '../translations/bus-license-plate-types-translations-keys';

export default function BusDetailsPage() {
  const tBuses = useTranslations('buses');
  const tCommon = useTranslations('common');
  const tSeatDiagrams = useTranslations('seatDiagrams');
  const tChromatics = useTranslations('chromatics');
  const { itemId: busId, isValidId } = useCollectionItemDetailsParams();
  const { data: bus, isLoading } = useQueryBus({
    busId,
    enabled: isValidId,
  });
  const { data: seatDiagram } = useQuerySeatDiagram({
    itemId: bus?.seatDiagramId ?? 0,
    enabled: !!bus?.seatDiagramId,
  });
  const { delete: deleteBus } = useBusMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deleteBus.mutateWithToast,
    });

  const onDelete = () => {
    if (!bus) return;
    setDeleteId(bus.id);
  };

  if (isLoading) {
    return <BusSkeleton />;
  }

  if (!bus) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={bus.registrationNumber}
        description={tBuses('details.description')}
        backHref={routes.buses.index}
      />

      <div className="flex justify-end mb-6">
        <ActionButtons
          editHref={routes.buses.getEditRoute(bus.id.toString())}
          onDelete={onDelete}
          editLabel={tCommon('actions.edit')}
          deleteLabel={tCommon('actions.delete')}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{tBuses('sections.basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">
                {tBuses('fields.economicNumber')}:
              </dt>
              <dd>{bus.economicNumber || '-'}</dd>

              <dt className="font-medium">
                {tBuses('fields.registrationNumber')}:
              </dt>
              <dd>{bus.registrationNumber}</dd>

              <dt className="font-medium">
                {tBuses('fields.licensePlateType')}:
              </dt>
              <dd>
                {tBuses(
                  `licensePlateTypes.${busLicensePlateTypesTranslationKeys[bus.licensePlateType]}`,
                ) || '-'}
              </dd>

              <dt className="font-medium">
                {tBuses('fields.licensePlateNumber')}:
              </dt>
              <dd>{bus.licensePlateNumber || '-'}</dd>

              <dt className="font-medium">
                {tBuses('fields.circulationCard')}:
              </dt>
              <dd>{bus.circulationCard || '-'}</dd>

              <dt className="font-medium">{tBuses('fields.status')}:</dt>
              <dd>
                <BusStatusBadge status={bus.status} />
              </dd>

              <dt className="font-medium">
                {tBuses('fields.availableForTourismOnly')}:
              </dt>
              <dd>
                <AffirmationBadge value={bus.availableForTourismOnly} />
              </dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tCommon('sections.systemInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{tCommon('fields.status')}:</dt>
              <dd>
                {bus.active ? (
                  <Badge variant="outline" className="bg-green-100">
                    {tCommon('status.active')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-100">
                    {tCommon('status.inactive')}
                  </Badge>
                )}
              </dd>

              <dt className="font-medium">{tCommon('fields.id')}:</dt>
              <dd>{bus.id}</dd>

              <dt className="font-medium">{tCommon('fields.createdAt')}:</dt>
              <dd>{parseAndFormatDateForHumansRelative(bus.createdAt)}</dd>

              <dt className="font-medium">{tCommon('fields.updatedAt')}:</dt>
              <dd>{parseAndFormatDateForHumansRelative(bus.updatedAt)}</dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{tBuses('sections.modelInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[1fr_2fr] gap-4 md:grid-cols-[1fr_2fr_1fr_2fr]">
            <dt className="font-medium">{tBuses('fields.manufacturer')}:</dt>
            <dd>{bus.manufacturer || '-'}</dd>

            <dt className="font-medium">{tBuses('fields.model')}:</dt>
            <dd>{bus.busModel || '-'}</dd>

            <dt className="font-medium">{tBuses('fields.year')}:</dt>
            <dd>{bus.year || '-'}</dd>

            <dt className="font-medium">{tBuses('fields.seatingCapacity')}:</dt>
            <dd>{bus.seatingCapacity || '-'}</dd>

            <dt className="font-medium">{tBuses('fields.numFloors')}:</dt>
            <dd>{bus.numFloors || '-'}</dd>

            <dt className="font-medium">{tBuses('fields.engineType')}:</dt>
            <dd>{bus.engineType || '-'}</dd>

            <dt className="font-medium">{tBuses('fields.purchaseDate')}:</dt>
            <dd>
              {bus.purchaseDate
                ? parseAndFormatDateForHumans(bus.purchaseDate)
                : '-'}
            </dd>

            <dt className="font-medium">{tBuses('fields.expirationDate')}:</dt>
            <dd>
              {bus.expirationDate
                ? parseAndFormatDateForHumans(bus.expirationDate)
                : '-'}
            </dd>

            <dt className="font-medium">{tBuses('fields.erpClientNumber')}:</dt>
            <dd>{bus.erpClientNumber || '-'}</dd>
          </dl>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{tBuses('sections.technicalInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[1fr_2fr] gap-4 md:grid-cols-[1fr_2fr_1fr_2fr]">
            <dt className="font-medium">{tBuses('fields.vehicleId')}:</dt>
            <dd>{bus.vehicleId || '-'}</dd>

            <dt className="font-medium">{tBuses('fields.serialNumber')}:</dt>
            <dd>{bus.serialNumber || '-'}</dd>

            <dt className="font-medium">{tBuses('fields.engineNumber')}:</dt>
            <dd>{bus.engineNumber || '-'}</dd>

            <dt className="font-medium">{tBuses('fields.chassisNumber')}:</dt>
            <dd>{bus.chassisNumber || '-'}</dd>

            <dt className="font-medium">
              {tBuses('fields.grossVehicleWeight')}:
            </dt>
            <dd>{bus.grossVehicleWeight || '-'}</dd>

            <dt className="font-medium">{tBuses('fields.sctPermit')}:</dt>
            <dd>{bus.sctPermit || '-'}</dd>
          </dl>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{tBuses('sections.maintenanceInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[1fr_2fr] gap-4 md:grid-cols-[1fr_2fr_1fr_2fr]">
            <dt className="font-medium">
              {tBuses('fields.currentKilometer')}:
            </dt>
            <dd>{bus.currentKilometer || '-'}</dd>

            <dt className="font-medium">{tBuses('fields.gpsId')}:</dt>
            <dd>{bus.gpsId || '-'}</dd>
            <dt className="font-medium">
              {tBuses('fields.lastMaintenanceDate')}:
            </dt>
            <dd>
              {bus.lastMaintenanceDate
                ? parseAndFormatDateForHumans(bus.lastMaintenanceDate)
                : '-'}
            </dd>

            <dt className="font-medium">
              {tBuses('fields.nextMaintenanceDate')}:
            </dt>
            <dd>
              {bus.nextMaintenanceDate
                ? parseAndFormatDateForHumans(bus.nextMaintenanceDate)
                : '-'}
            </dd>
          </dl>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{tBuses('sections.seatDiagram')}</CardTitle>
        </CardHeader>
        <CardContent>
          {seatDiagram && (
            <div className="space-y-4 pt-4">
              <dl>
                <dt className="font-medium">{tSeatDiagrams('fields.name')}:</dt>
                <dd>{seatDiagram.name}</dd>
              </dl>
              {seatDiagram.seatsPerFloor.map((floor) => (
                <div key={floor.floorNumber} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">
                    {tSeatDiagrams('fields.floor', {
                      floorNumber: floor.floorNumber,
                    })}
                  </h4>
                  <dl className="grid grid-cols-[1fr_1fr] gap-2 text-sm">
                    <dt>{tSeatDiagrams('fields.numRows')}:</dt>
                    <dd>{floor.numRows ?? '-'}</dd>
                    <dt>{tSeatDiagrams('fields.seatsLeft')}:</dt>
                    <dd>{floor.seatsLeft ?? '-'}</dd>
                    <dt>{tSeatDiagrams('fields.seatsRight')}:</dt>
                    <dd>{floor.seatsRight ?? '-'}</dd>
                  </dl>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{tBuses('sections.chromatics')}</CardTitle>
        </CardHeader>
        <CardContent>
          {bus.chromatic ? (
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{tChromatics('fields.name')}:</dt>
              <dd>{bus.chromatic?.name || '-'}</dd>
              <dt className="font-medium">
                {tChromatics('fields.description')}:
              </dt>
              <dd>{bus.chromatic?.description || '-'}</dd>
            </dl>
          ) : (
            '-'
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{tBuses('sections.technologies')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {(bus.technologies?.length ?? 0) > 0
              ? bus.technologies?.map((technology) => (
                  <TechnologyCard key={technology.id} technology={technology} />
                ))
              : '-'}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{tBuses('sections.busCrew')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {(bus.busCrew?.length ?? 0) > 0
              ? bus.busCrew?.map((crew) =>
                  crew.driver ? (
                    <DriverCard key={crew.id} driver={crew.driver} />
                  ) : null,
                )
              : '-'}
          </div>
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}
