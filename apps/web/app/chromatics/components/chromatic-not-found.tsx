'use client';

import { useTranslations } from 'next-intl';
import NotFound from '@/components/not-found';
import routes from '@/services/routes';

export default function ChromaticNotFound() {
  const tChromatics = useTranslations('chromatics');

  return (
    <NotFound
      title={tChromatics('errors.notFound.title')}
      description={tChromatics('errors.notFound.description')}
      backHref={routes.chromatics.index}
      backLabel={tChromatics('actions.backToList')}
    />
  );
}
