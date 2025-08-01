'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import EventForm, { EventFormValues } from '@/events/components/event-form';
// import useEventMutations from '@/events/hooks/use-event-mutations';
import routes from '@/services/routes';

export default function NewEventPage() {
  // const { create: createEvent } = useEventMutations();
  const tEvents = useTranslations('eventTypes');

  // @todo finish event form implementation and use the real submit function.
  const dummySubmit = (values: EventFormValues) =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve(values);
      }, 1000);
    });

  return (
    <div>
      <PageHeader
        title={tEvents('actions.create')}
        backHref={routes.events.index}
        backLabel={tEvents('actions.backToList')}
      />

      <EventForm onSubmit={dummySubmit} />
    </div>
  );
}
