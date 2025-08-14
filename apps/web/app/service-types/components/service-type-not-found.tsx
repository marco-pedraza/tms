'use client';

import { useTranslations } from 'next-intl';
import NotFound from '@/components/not-found';
import routes from '@/services/routes';

export default function ServiceTypeNotFound() {
  const tServiceTypes = useTranslations('serviceTypes');

  return (
    <NotFound
      title={tServiceTypes('errors.notFound.title')}
      description={tServiceTypes('errors.notFound.description')}
      backHref={routes.serviceTypes.index}
      backLabel={tServiceTypes('actions.backToList')}
    />
  );
}
