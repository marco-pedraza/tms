'use client';

import { useTranslations } from 'next-intl';
import BusLineNotFound from '@/bus-lines/components/bus-line-not-found';
import useBusLineDetailsParams from '@/bus-lines/hooks/use-bus-line-details-params';
import useQueryBusLine from '@/bus-lines/hooks/use-query-bus-line';
import LoadError from '@/components/load-error';
import routes from '@/services/routes';

export default function BusLineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tBusLines = useTranslations('busLines');
  const { busLineId, isValidId } = useBusLineDetailsParams();
  const { status, error } = useQueryBusLine({
    busLineId,
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
