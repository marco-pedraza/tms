'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import EventForm from '@/events/components/event-form';
import useEventMutations from '@/events/hooks/use-event-mutations';
import routes from '@/services/routes';

export default function NewEventPage() {
  const { create: createEvent } = useEventMutations();
  const tEvents = useTranslations('eventTypes');

  return (
    <div>
      <PageHeader
        title={tEvents('actions.create')}
        description={tEvents('description')}
        backHref={routes.events.index}
        backLabel={tEvents('actions.backToList')}
      />

      <EventForm onSubmit={createEvent.mutateWithToast} />
    </div>
  );
}
