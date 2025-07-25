'use client';

import { formatDuration } from 'date-fns';
import { useTranslations } from 'next-intl';
import ActionButtons from '@/components/action-buttons';
import AffirmationBadge from '@/components/affirmation-badge';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import IsActiveBadge from '@/components/is-active-badge';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EventSkeleton from '@/events/components/event-skeleton';
import useEventMutations from '@/events/hooks/use-event-mutations';
import useQueryEvent from '@/events/hooks/use-query-event';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import routes from '@/services/routes';

export default function EventDetailsPage() {
  const tEvents = useTranslations('eventTypes');
  const tCommon = useTranslations('common');
  const { itemId: eventTypeId, isValidId } = useCollectionItemDetailsParams();
  const { data: eventType, isLoading } = useQueryEvent({
    itemId: eventTypeId,
    enabled: isValidId,
  });
  const { delete: deleteEvent } = useEventMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deleteEvent.mutateWithToast,
    });

  const onDelete = () => {
    if (!eventType) return;
    setDeleteId(eventType.id);
  };

  if (isLoading) {
    return <EventSkeleton />;
  }

  if (!eventType) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={eventType.name}
        description={tEvents('details.description')}
        backHref={routes.events.index}
      />

      <div className="flex justify-end mb-6">
        <ActionButtons
          editHref={routes.events.getEditRoute(eventType.id.toString())}
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
              <dd>{eventType.name}</dd>

              <dt className="font-medium">{tCommon('fields.code')}:</dt>
              <dd>{eventType.code}</dd>

              <dt className="font-medium">{tCommon('fields.description')}:</dt>
              <dd>{eventType.description}</dd>

              <dt className="font-medium">{tCommon('fields.status')}:</dt>
              <dd>
                <IsActiveBadge isActive={eventType.active} />
              </dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tCommon('sections.operativeConfig')}</CardTitle>
            <small className="text-muted-foreground">
              {tCommon('sections.operativeConfigDescription')}
            </small>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{tEvents('fields.baseTime')}:</dt>
              <dd className="flex flex-col gap-2">
                {formatDuration({ minutes: eventType.baseTime })}
                <small className="text-muted-foreground">
                  {tEvents('details.baseTime')}
                </small>
              </dd>

              <dt className="font-medium">{tEvents('fields.integration')}:</dt>
              <dd className="flex flex-col gap-2">
                <AffirmationBadge value={eventType.integration} />
                <small className="text-muted-foreground">
                  {tEvents('details.integration')}
                </small>
              </dd>

              <dt className="font-medium">{tEvents('fields.needsCost')}:</dt>
              <dd className="flex flex-col gap-2">
                <AffirmationBadge value={eventType.needsCost} />
                <small className="text-muted-foreground">
                  {tEvents('details.needsCost')}
                </small>
              </dd>

              <dt className="font-medium">
                {tEvents('fields.needsQuantity')}:
              </dt>
              <dd className="flex flex-col gap-2">
                <AffirmationBadge value={eventType.needsQuantity} />
                <small className="text-muted-foreground">
                  {tEvents('details.needsQuantity')}
                </small>
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
              <dd>{eventType.id}</dd>

              <dt className="font-medium">{tCommon('fields.createdAt')}:</dt>
              <dd>
                {eventType.createdAt
                  ? new Date(eventType.createdAt).toLocaleString()
                  : '-'}
              </dd>

              <dt className="font-medium">{tCommon('fields.updatedAt')}:</dt>
              <dd>
                {eventType.updatedAt
                  ? new Date(eventType.updatedAt).toLocaleString()
                  : '-'}
              </dd>
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
