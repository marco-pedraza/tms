'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import EventForm, { EventFormValues } from '@/events/components/event-form';
import useEventMutations from '@/events/hooks/use-event-mutations';
import routes from '@/services/routes';

export default function NewEventPage() {
  const { create: createEvent } = useEventMutations();
  const tEvents = useTranslations('eventTypes');

  const handleSubmit = (values: EventFormValues) => {
    return createEvent.mutateWithToast({
      ...values,
      description: values.description ?? undefined,
    });
  };

  return (
    <div>
      <PageHeader
        title={tEvents('actions.create')}
        backHref={routes.events.index}
        backLabel={tEvents('actions.backToList')}
      />

      <EventForm onSubmit={handleSubmit} />
    </div>
  );
}
