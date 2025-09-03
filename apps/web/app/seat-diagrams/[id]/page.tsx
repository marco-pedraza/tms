'use client';

import { useTranslations } from 'next-intl';
import ActionButtons from '@/components/action-buttons';
import AffirmationBadge from '@/components/affirmation-badge';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import IsActiveBadge from '@/components/is-active-badge';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import SeatDiagramSkeleton from '@/seat-diagrams/components/seat-diagram-skeleton';
import useQuerySeatDiagram from '@/seat-diagrams/hooks/use-query-seat-diagram';
import useSeatDiagramMutations from '@/seat-diagrams/hooks/use-seat-diagram-mutations';
import routes from '@/services/routes';

export default function SeatDiagramDetailsPage() {
  const tSeatDiagrams = useTranslations('seatDiagrams');
  const tCommon = useTranslations('common');
  const { itemId, isValidId } = useCollectionItemDetailsParams();
  const { data: seatDiagram, isLoading } = useQuerySeatDiagram({
    itemId,
    enabled: isValidId,
  });
  const { delete: deleteSeatDiagram } = useSeatDiagramMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deleteSeatDiagram.mutateWithToast,
    });

  const onDelete = () => {
    if (!seatDiagram) return;
    setDeleteId(seatDiagram.id);
  };

  if (isLoading) {
    return <SeatDiagramSkeleton />;
  }

  if (!seatDiagram) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={seatDiagram.name}
        description={tSeatDiagrams('details.description')}
        backHref={routes.seatDiagrams.index}
        backLabel={tSeatDiagrams('actions.backToList')}
      />

      <div className="flex justify-end mb-6">
        <ActionButtons
          editHref={routes.seatDiagrams.getEditRoute(seatDiagram.id.toString())}
          onDelete={onDelete}
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
              <dt className="font-medium">{tCommon('fields.name')}:</dt>
              <dd>{seatDiagram.name}</dd>

              <dt className="font-medium">{tCommon('fields.description')}:</dt>
              <dd>{seatDiagram.description || '-'}</dd>

              <dt className="font-medium">
                {tSeatDiagrams('fields.maxCapacity')}:
              </dt>
              <dd>
                {tSeatDiagrams('fields.passengers', {
                  count: seatDiagram.maxCapacity,
                })}
              </dd>

              <dt className="font-medium">
                {tSeatDiagrams('fields.totalSeats')}:
              </dt>
              <dd>
                {tSeatDiagrams('fields.seats', {
                  count: seatDiagram.totalSeats,
                })}
              </dd>

              <dt className="font-medium">
                {tSeatDiagrams('fields.numFloors')}:
              </dt>
              <dd>
                {tSeatDiagrams('fields.floors', {
                  count: seatDiagram.numFloors,
                })}
              </dd>

              <dt className="font-medium">
                {tSeatDiagrams('fields.isFactoryDefault')}:
              </dt>
              <dd>
                <AffirmationBadge value={seatDiagram.isFactoryDefault} />
              </dd>

              <dt className="font-medium">{tCommon('fields.status')}:</dt>
              <dd>
                <IsActiveBadge isActive={seatDiagram.active} />
              </dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tSeatDiagrams('fields.seatsPerFloor')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {seatDiagram.seatsPerFloor.map((floor) => (
                <div key={floor.floorNumber} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">
                    {tSeatDiagrams('fields.floor', {
                      floorNumber: floor.floorNumber,
                    })}
                  </h4>
                  <dl className="grid grid-cols-[1fr_1fr] gap-2 text-sm">
                    <dt>{tSeatDiagrams('fields.numRows')}:</dt>
                    <dd>{floor.numRows}</dd>
                    <dt>{tSeatDiagrams('fields.seatsLeft')}:</dt>
                    <dd>{floor.seatsLeft}</dd>
                    <dt>{tSeatDiagrams('fields.seatsRight')}:</dt>
                    <dd>{floor.seatsRight}</dd>
                  </dl>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{tCommon('sections.systemInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4 md:grid-cols-[1fr_2fr_1fr_2fr]">
              <dt className="font-medium">{tCommon('fields.id')}:</dt>
              <dd>{seatDiagram.id}</dd>

              <dt className="font-medium">{tCommon('fields.createdAt')}:</dt>
              <dd>{new Date(seatDiagram.createdAt ?? '').toLocaleString()}</dd>

              <dt className="font-medium">{tCommon('fields.updatedAt')}:</dt>
              <dd>{new Date(seatDiagram.updatedAt ?? '').toLocaleString()}</dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}
