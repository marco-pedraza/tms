'use client';

import { useTranslations } from 'next-intl';
import LoadError from '@/components/load-error';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import SeatDiagramNotFound from '@/seat-diagrams/components/seat-diagram-not-found';
import useQuerySeatDiagram from '@/seat-diagrams/hooks/use-query-seat-diagram';
import routes from '@/services/routes';

export default function SeatDiagramLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tSeatDiagrams = useTranslations('seatDiagrams');
  const { itemId, isValidId } = useCollectionItemDetailsParams();
  const { status, error } = useQuerySeatDiagram({
    itemId,
    enabled: isValidId,
  });
  const isSeatDiagramNotFound = !isValidId || error?.code === 'not_found';

  if (isSeatDiagramNotFound) {
    return <SeatDiagramNotFound />;
  }

  if (status === 'error') {
    return (
      <LoadError
        backHref={routes.seatDiagrams.index}
        backLabel={tSeatDiagrams('actions.backToList')}
      />
    );
  }

  return children;
}
