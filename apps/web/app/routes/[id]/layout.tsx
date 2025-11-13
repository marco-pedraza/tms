'use client';

import { useTranslations } from 'next-intl';
import LoadError from '@/components/load-error';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import RouteNotFound from '@/routes/components/route-not-found';
import useQueryRoute from '@/routes/hooks/use-query-route';
import routes from '@/services/routes';

export default function RouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tRoutes = useTranslations('routes');
  const { itemId: routeId, isValidId } = useCollectionItemDetailsParams();
  const { status, error } = useQueryRoute({
    itemId: routeId,
    enabled: isValidId,
  });
  const isRouteNotFound = !isValidId || error?.code === 'not_found';

  if (isRouteNotFound) {
    return <RouteNotFound />;
  }

  if (status === 'error') {
    return (
      <LoadError
        backHref={routes.routes.index}
        backLabel={tRoutes('actions.backToList')}
      />
    );
  }

  return children;
}
