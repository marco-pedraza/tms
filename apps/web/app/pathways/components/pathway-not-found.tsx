'use client';

import { useTranslations } from 'next-intl';
import NotFound from '@/components/not-found';
import routes from '@/services/routes';

export default function PathwayNotFound() {
  const tPathways = useTranslations('pathways');

  return (
    <NotFound
      title={tPathways('errors.notFound.title')}
      description={tPathways('errors.notFound.description')}
      backHref={routes.pathways.index}
      backLabel={tPathways('actions.backToList')}
    />
  );
}
