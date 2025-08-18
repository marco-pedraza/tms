import { useTranslations } from 'next-intl';
import NotFound from '@/components/not-found';
import routes from '@/services/routes';

export default function BusNotFound() {
  const tBuses = useTranslations('buses');

  return (
    <NotFound
      title={tBuses('notFound.title')}
      description={tBuses('notFound.description')}
      backHref={routes.buses.index}
      backLabel={tBuses('actions.backToList')}
    />
  );
}
