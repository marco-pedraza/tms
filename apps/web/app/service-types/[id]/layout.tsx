'use client';

import { useTranslations } from 'next-intl';
import LoadError from '@/components/load-error';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import ServiceTypeNotFound from '@/service-types/components/service-type-not-found';
import useQueryServiceType from '@/service-types/hooks/use-query-service-type';
import routes from '@/services/routes';

export default function ServiceTypeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('serviceTypes');
  const { itemId: serviceTypeId, isValidId } = useCollectionItemDetailsParams();
  const { status, error } = useQueryServiceType({
    itemId: serviceTypeId,
    enabled: isValidId,
  });
  const isNotFound = !isValidId || error?.code === 'not_found';

  if (isNotFound) {
    return <ServiceTypeNotFound />;
  }

  if (status === 'error') {
    return (
      <LoadError
        backHref={routes.serviceTypes.index}
        backLabel={t('actions.backToList')}
      />
    );
  }

  return children;
}
