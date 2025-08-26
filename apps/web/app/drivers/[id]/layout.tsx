'use client';

import { useTranslations } from 'next-intl';
import LoadError from '@/components/load-error';
import DriverNotFound from '@/drivers/components/driver-not-found';
import useQueryDriver from '@/drivers/hooks/use-query-driver';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import routes from '@/services/routes';

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tDrivers = useTranslations('drivers');
  const { itemId: driverId, isValidId } = useCollectionItemDetailsParams();
  const { status, error } = useQueryDriver({
    itemId: driverId,
    enabled: isValidId,
  });
  const isDriverNotFound = !isValidId || error?.code === 'not_found';

  if (isDriverNotFound) {
    return <DriverNotFound />;
  }

  if (status === 'error') {
    return (
      <LoadError
        backHref={routes.drivers.index}
        backLabel={tDrivers('actions.backToList')}
      />
    );
  }

  return children;
}
