'use client';

import { useTranslations } from 'next-intl';
import LoadError from '@/components/load-error';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import PathwayNotFound from '@/pathways/components/pathway-not-found';
import useQueryPathway from '@/pathways/hooks/use-query-pathway';
import routes from '@/services/routes';

export default function PathwayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tPathways = useTranslations('pathways');
  const { itemId: pathwayId, isValidId } = useCollectionItemDetailsParams();
  const { status, error } = useQueryPathway({
    itemId: pathwayId,
    enabled: isValidId,
  });
  const isPathwayNotFound = !isValidId || error?.code === 'not_found';

  if (isPathwayNotFound) {
    return <PathwayNotFound />;
  }

  if (status === 'error') {
    return (
      <LoadError
        backHref={routes.pathways.index}
        backLabel={tPathways('actions.backToList')}
      />
    );
  }

  return children;
}
