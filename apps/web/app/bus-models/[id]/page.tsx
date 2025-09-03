'use client';

import { useTranslations } from 'next-intl';
import useQuerySeatDiagram from '@/app/seat-diagrams/hooks/use-query-seat-diagram';
import BusModelSkeleton from '@/bus-models/components/bus-model-skeleton';
import useBusModelMutations from '@/bus-models/hooks/use-bus-model-mutations';
import useQueryBusModel from '@/bus-models/hooks/use-query-bus-model';
import busEngineTypeTranslationKeys from '@/bus-models/translations/bus-engine-type-translation-keys';
import ActionButtons from '@/components/action-buttons';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { TabsList } from '@/components/ui/tabs';
import { TabsTrigger } from '@/components/ui/tabs';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import routes from '@/services/routes';

export default function BusModelDetailsPage() {
  const tBusModels = useTranslations('busModels');
  const tSeatDiagrams = useTranslations('seatDiagrams');
  const tCommon = useTranslations('common');
  const { itemId: busModelId, isValidId } = useCollectionItemDetailsParams();
  const { data: busModel, isLoading } = useQueryBusModel({
    itemId: busModelId,
    enabled: isValidId,
  });
  const { data: seatDiagram } = useQuerySeatDiagram({
    itemId: busModel?.defaultBusDiagramModelId ?? 0,
    enabled: !!busModel?.defaultBusDiagramModelId,
  });
  const { delete: deleteBusModel } = useBusModelMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deleteBusModel.mutateWithToast,
    });

  const onDelete = () => {
    if (!busModelId) return;
    setDeleteId(busModelId);
  };

  if (isLoading) {
    return <BusModelSkeleton />;
  }

  if (!busModel) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={busModel.manufacturer}
        description={tBusModels('details.description')}
        backHref={routes.busModels.index}
      />

      <div className="flex justify-end mb-6">
        <ActionButtons
          editHref={routes.busModels.getEditRoute(busModel.id.toString())}
          onDelete={onDelete}
          editLabel={tCommon('actions.edit')}
          deleteLabel={tCommon('actions.delete')}
        />
      </div>

      <div className="max-w-7xl">
        <Tabs defaultValue="info">
          <TabsList className="w-full">
            <TabsTrigger value="info">
              {tBusModels('sections.info')}
            </TabsTrigger>
            <TabsTrigger value="amenities">
              {tBusModels('sections.amenities')}
            </TabsTrigger>
            <TabsTrigger value="diagram">
              {tBusModels('sections.diagram')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="info">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{tCommon('sections.basicInfo')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-[1fr_2fr] gap-4">
                    <dt className="font-medium">
                      {tBusModels('fields.manufacturer')}:
                    </dt>
                    <dd>{busModel.manufacturer || '-'}</dd>

                    <dt className="font-medium">
                      {tBusModels('fields.model')}:
                    </dt>
                    <dd>{busModel.model || '-'}</dd>

                    <dt className="font-medium">
                      {tBusModels('fields.year')}:
                    </dt>
                    <dd>{busModel.year || '-'}</dd>

                    <dt className="font-medium">
                      {tBusModels('fields.seatingCapacity')}:
                    </dt>
                    <dd>{busModel.seatingCapacity || '-'}</dd>

                    <dt className="font-medium">
                      {tBusModels('fields.trunkCapacity')}:
                    </dt>
                    <dd>{busModel.trunkCapacity || '-'}</dd>

                    <dt className="font-medium">
                      {tBusModels('fields.fuelEfficiency')}:
                    </dt>
                    <dd>{busModel.fuelEfficiency || '-'}</dd>

                    <dt className="font-medium">
                      {tBusModels('fields.maxCapacity')}:
                    </dt>
                    <dd>{busModel.maxCapacity || '-'}</dd>

                    <dt className="font-medium">
                      {tBusModels('fields.numFloors')}:
                    </dt>
                    <dd>{busModel.numFloors || '-'}</dd>

                    <dt className="font-medium">
                      {tBusModels('fields.engineType')}:
                    </dt>
                    <dd>
                      {busModel.engineType
                        ? tBusModels(
                            `engineTypes.${busEngineTypeTranslationKeys[busModel.engineType]}`,
                          )
                        : '-'}
                    </dd>

                    <dt className="font-medium">{tCommon('fields.status')}:</dt>
                    <dd>
                      {busModel.active ? (
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
                  <CardTitle>{tCommon('sections.systemInfo')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-[1fr_2fr] gap-4">
                    <dt className="font-medium">{tCommon('fields.id')}:</dt>
                    <dd>{busModel.id}</dd>

                    <dt className="font-medium">
                      {tCommon('fields.createdAt')}:
                    </dt>
                    <dd>
                      {busModel.createdAt
                        ? new Date(busModel.createdAt).toLocaleString()
                        : '-'}
                    </dd>

                    <dt className="font-medium">
                      {tCommon('fields.updatedAt')}:
                    </dt>
                    <dd>
                      {busModel.updatedAt
                        ? new Date(busModel.updatedAt).toLocaleString()
                        : '-'}
                    </dd>
                  </dl>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="amenities">
            <Card>
              <CardHeader>
                <CardTitle>{tBusModels('sections.amenities')}</CardTitle>
              </CardHeader>
            </Card>
          </TabsContent>
          <TabsContent value="diagram">
            <Card>
              <CardHeader>
                <CardTitle>{tBusModels('sections.diagram')}</CardTitle>
              </CardHeader>
              <CardContent>
                {seatDiagram && (
                  <div className="space-y-4 pt-4">
                    <dl>
                      <dt className="font-medium">
                        {tSeatDiagrams('fields.name')}:
                      </dt>
                      <dd>{seatDiagram.name}</dd>
                    </dl>
                    {seatDiagram.seatsPerFloor.map((floor) => (
                      <div
                        key={floor.floorNumber}
                        className="border rounded-lg p-4"
                      >
                        <h4 className="font-medium mb-2">
                          {tSeatDiagrams('fields.floor', {
                            floorNumber: floor.floorNumber,
                          })}
                        </h4>
                        <dl className="grid grid-cols-[1fr_1fr] gap-2 text-sm">
                          <dt>{tSeatDiagrams('fields.numRows')}:</dt>
                          <dd>{floor.numRows || '-'}</dd>
                          <dt>{tSeatDiagrams('fields.seatsLeft')}:</dt>
                          <dd>{floor.seatsLeft || '-'}</dd>
                          <dt>{tSeatDiagrams('fields.seatsRight')}:</dt>
                          <dd>{floor.seatsRight || '-'}</dd>
                        </dl>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}
