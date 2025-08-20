'use client';

import { useTranslations } from 'next-intl';
import BusModelNotFound from '@/bus-models/components/bus-model-not-found';
import useQueryBusModel from '@/bus-models/hooks/use-query-bus-model';
import LoadError from '@/components/load-error';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import routes from '@/services/routes';

export default function BusModelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tBusModels = useTranslations('busModels');
  const { itemId: busModelId, isValidId } = useCollectionItemDetailsParams();
  const { status, error } = useQueryBusModel({
    itemId: busModelId,
    enabled: isValidId,
  });
  const isBusModelNotFound = !isValidId || error?.code === 'not_found';

  if (isBusModelNotFound) {
    return <BusModelNotFound />;
  }

  if (status === 'error') {
    return (
      <LoadError
        backHref={routes.busModels.index}
        backLabel={tBusModels('actions.backToList')}
      />
    );
  }

  return children;
}
