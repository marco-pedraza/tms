'use client';

import { useTranslations } from 'next-intl';
import NotFound from '@/components/not-found';
import routes from '@/services/routes';

export default function BusModelNotFound() {
  const tBusModels = useTranslations('busModels');

  return (
    <NotFound
      title={tBusModels('errors.notFound.title')}
      description={tBusModels('errors.notFound.description')}
      backHref={routes.busModels.index}
      backLabel={tBusModels('actions.backToList')}
    />
  );
}
