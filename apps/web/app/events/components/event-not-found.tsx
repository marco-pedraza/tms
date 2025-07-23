import { useTranslations } from 'next-intl';
import NotFound from '@/components/not-found';
import routes from '@/services/routes';

export default function EventNotFound() {
  const tEvents = useTranslations('eventTypes');

  return (
    <NotFound
      title={tEvents('errors.notFound.title')}
      description={tEvents('errors.notFound.description')}
      backHref={routes.events.index}
      backLabel={tEvents('actions.backToList')}
    />
  );
}
