import { useTranslations } from 'next-intl';
import NotFound from '@/components/not-found';
import routes from '@/services/routes';

export default function LabelNotFound() {
  const tLabels = useTranslations('labels');

  return (
    <NotFound
      title={tLabels('errors.notFound.title')}
      description={tLabels('errors.notFound.description')}
      backHref={routes.labels.index}
      backLabel={tLabels('actions.backToList')}
    />
  );
}
