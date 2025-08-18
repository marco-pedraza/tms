'use client';

import { useTranslations } from 'next-intl';
import BusNotFound from '@/buses/components/bus-not-found';
import useQueryBus from '@/buses/hooks/use-query-bus';
import LoadError from '@/components/load-error';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import routes from '@/services/routes';

/**
 * Layout component for bus detail pages
 *
 * Handles common error states and resource not found cases,
 * while allowing children to handle their own loading states
 */
export default function BusLayout({ children }: { children: React.ReactNode }) {
  const tBuses = useTranslations('buses');
  const { itemId: busId, isValidId } = useCollectionItemDetailsParams();
  const { status, error } = useQueryBus({
    busId,
    enabled: isValidId,
  });
  const isBusNotFound = !isValidId || error?.code === 'not_found';

  if (isBusNotFound) {
    return <BusNotFound />;
  }

  if (status === 'error') {
    return (
      <LoadError
        backHref={routes.buses.index}
        backLabel={tBuses('actions.backToList')}
      />
    );
  }

  return children;
}
