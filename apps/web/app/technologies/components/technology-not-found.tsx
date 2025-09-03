'use client';

import { useTranslations } from 'next-intl';
import NotFound from '@/components/not-found';
import routes from '@/services/routes';

export default function TechnologyNotFound() {
  const tTechnologies = useTranslations('technologies');

  return (
    <NotFound
      title={tTechnologies('errors.notFound.title')}
      description={tTechnologies('errors.notFound.description')}
      backHref={routes.technologies.index}
      backLabel={tTechnologies('actions.backToList')}
    />
  );
}
