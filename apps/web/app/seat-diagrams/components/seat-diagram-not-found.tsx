'use client';

import { useTranslations } from 'next-intl';
import NotFound from '@/components/not-found';
import routes from '@/services/routes';

export default function SeatDiagramNotFound() {
  const t = useTranslations('seatDiagrams');

  return (
    <NotFound
      title={t('errors.notFound.title')}
      description={t('errors.notFound.description')}
      backHref={routes.seatDiagrams.index}
      backLabel={t('actions.backToList')}
    />
  );
}
