'use client';

import { useTranslations } from 'next-intl';
import NotFound from '@/components/not-found';
import routes from '@/services/routes';

export default function RouteNotFound() {
  const tRoutes = useTranslations('routes');

  return (
    <NotFound
      title={tRoutes('errors.notFound.title')}
      description={tRoutes('errors.notFound.description')}
      backHref={routes.routes.index}
      backLabel={tRoutes('actions.backToList')}
    />
  );
}
