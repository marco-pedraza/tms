import { useTranslations } from 'next-intl';
import NotFound from '@/components/not-found';
import routes from '@/services/routes';

export default function BusLineNotFound() {
  const tBusLines = useTranslations('busLines');

  return (
    <NotFound
      title={tBusLines('errors.notFound.title')}
      description={tBusLines('errors.notFound.description')}
      backHref={routes.busLines.index}
      backLabel={tBusLines('actions.backToList')}
    />
  );
}
