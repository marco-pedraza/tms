'use client';

import { useTranslations } from 'next-intl';
import LoadError from '@/components/load-error';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import routes from '@/services/routes';
import TechnologyNotFound from '@/technologies/components/technology-not-found';
import useQueryTechnology from '@/technologies/hooks/use-query-technology';

export default function TechnologyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tTechnologies = useTranslations('technologies');
  const { itemId: technologyId, isValidId } = useCollectionItemDetailsParams();
  const { status, error } = useQueryTechnology({
    itemId: technologyId,
    enabled: isValidId,
  });
  const isTechnologyNotFound = !isValidId || error?.code === 'not_found';

  if (isTechnologyNotFound) {
    return <TechnologyNotFound />;
  }

  if (status === 'error') {
    return (
      <LoadError
        backHref={routes.technologies.index}
        backLabel={tTechnologies('actions.backToList')}
      />
    );
  }

  return children;
}
