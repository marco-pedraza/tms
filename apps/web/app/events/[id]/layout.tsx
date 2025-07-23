'use client';

import { useTranslations } from 'next-intl';
import LoadError from '@/components/load-error';
import EventNotFound from '@/events/components/event-not-found';
import useQueryEvent from '@/events/hooks/use-query-event';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import routes from '@/services/routes';

/**
 * Layout component for event detail pages
 *
 * Handles common error states and resource not found cases,
 * while allowing children to handle their own loading states
 */
export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tEvents = useTranslations('eventTypes');
  const { itemId: eventTypeId, isValidId } = useCollectionItemDetailsParams();
  const { status, error } = useQueryEvent({
    itemId: eventTypeId,
    enabled: isValidId,
  });
  const isEventNotFound = !isValidId || error?.code === 'not_found';

  if (isEventNotFound) {
    return <EventNotFound />;
  }

  if (status === 'error') {
    return (
      <LoadError
        backHref={routes.events.index}
        backLabel={tEvents('actions.backToList')}
      />
    );
  }

  return children;
}
