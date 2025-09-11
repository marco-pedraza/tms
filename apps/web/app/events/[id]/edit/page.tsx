'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import EventForm, { EventFormValues } from '@/events/components/event-form';
import EventFormSkeleton from '@/events/components/event-form-skeleton';
import useEventMutations from '@/events/hooks/use-event-mutations';
import useQueryEvent from '@/events/hooks/use-query-event';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import routes from '@/services/routes';

export default function EditEventPage() {
  const tEvents = useTranslations('eventTypes');
  const { itemId: EventId, isValidId } = useCollectionItemDetailsParams();
  const { data, isLoading } = useQueryEvent({
    itemId: EventId,
    enabled: isValidId,
  });
  const { update: updateEvent } = useEventMutations();

  const handleSubmit = (values: EventFormValues) => {
    return updateEvent.mutateWithToast({
      id: EventId,
      values: {
        ...values,
        description: values.description ?? undefined,
      },
    });
  };

  if (isLoading) {
    return <EventFormSkeleton />;
  }

  if (!data) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={tEvents('edit.title')}
        description={data.name}
        backHref={routes.events.index}
      />
      <EventForm
        defaultValues={{
          ...data,
          description: data.description ?? '',
          baseTime: (data.baseTime ?? 0).toString(),
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
