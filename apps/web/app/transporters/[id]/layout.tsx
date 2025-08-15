'use client';

import { useTranslations } from 'next-intl';
import LoadError from '@/components/load-error';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import routes from '@/services/routes';
import TransporterNotFound from '@/transporters/components/transporter-not-found';
import useQueryTransporter from '@/transporters/hooks/use-query-transporter';

/**
 * Layout component for transporter detail pages
 *
 * Handles common error states and resource not found cases,
 * while allowing children to handle their own loading states
 */
export default function TransporterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tTransporters = useTranslations('transporters');
  const { itemId: transporterId, isValidId } = useCollectionItemDetailsParams();
  const { status, error } = useQueryTransporter({
    itemId: transporterId,
    enabled: isValidId,
  });
  const isTransporterNotFound = !isValidId || error?.code === 'not_found';

  if (isTransporterNotFound) {
    return <TransporterNotFound />;
  }

  if (status === 'error') {
    return (
      <LoadError
        backHref={routes.transporters.index}
        backLabel={tTransporters('actions.backToList')}
      />
    );
  }

  return children;
}
