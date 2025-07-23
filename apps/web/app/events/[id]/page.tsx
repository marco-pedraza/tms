'use client';

import { useTranslations } from 'next-intl';
import ActionButtons from '@/components/action-buttons';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
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
                {eventType.active ? (
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
