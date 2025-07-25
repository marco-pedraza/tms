'use client';

import { useTranslations } from 'next-intl';
import LoadError from '@/components/load-error';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import LabelNotFound from '@/labels/components/label-not-found';
import useQueryLabel from '@/labels/hooks/use-query-label';
import routes from '@/services/routes';

export default function LabelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tLabels = useTranslations('labels');
  const { itemId: labelId, isValidId } = useCollectionItemDetailsParams();
  const { status, error } = useQueryLabel({
    itemId: labelId,
    enabled: isValidId,
  });
  const isLabelNotFound = !isValidId || error?.code === 'not_found';

  if (isLabelNotFound) {
    return <LabelNotFound />;
  }

  if (status === 'error') {
    return (
      <LoadError
        backHref={routes.labels.index}
        backLabel={tLabels('actions.backToList')}
      />
    );
  }

  return children;
}
