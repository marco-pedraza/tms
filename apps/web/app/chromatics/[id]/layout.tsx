'use client';

import { useTranslations } from 'next-intl';
import ChromaticNotFound from '@/chromatics/components/chromatic-not-found';
import useQueryChromatic from '@/chromatics/hooks/use-query-chromatic';
import LoadError from '@/components/load-error';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import routes from '@/services/routes';

export default function ChromaticLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tChromatics = useTranslations('chromatics');
  const { itemId: chromaticId, isValidId } = useCollectionItemDetailsParams();
  const { status, error } = useQueryChromatic({
    itemId: chromaticId,
    enabled: isValidId,
  });
  const isChromaticNotFound = !isValidId || error?.code === 'not_found';

  if (isChromaticNotFound) {
    return <ChromaticNotFound />;
  }

  if (status === 'error') {
    return (
      <LoadError
        backHref={routes.chromatics.index}
        backLabel={tChromatics('actions.backToList')}
      />
    );
  }

  return children;
}
