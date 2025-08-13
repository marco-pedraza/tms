'use client';

import { useTranslations } from 'next-intl';
import BusLineNotFound from '@/bus-lines/components/bus-line-not-found';
import useQueryBusLine from '@/bus-lines/hooks/use-query-bus-line';
import LoadError from '@/components/load-error';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import routes from '@/services/routes';

export default function BusLineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tBusLines = useTranslations('busLines');
  const { itemId: busLineId, isValidId } = useCollectionItemDetailsParams();
  const { status, error } = useQueryBusLine({
    itemId: busLineId,
    enabled: isValidId,
  });
  const isBusLineNotFound = !isValidId || error?.code === 'not_found';

  if (isBusLineNotFound) {
    return <BusLineNotFound />;
  }

  if (status === 'error') {
    return (
      <LoadError
        backHref={routes.busLines.index}
        backLabel={tBusLines('actions.backToList')}
      />
    );
  }

  return children;
}
