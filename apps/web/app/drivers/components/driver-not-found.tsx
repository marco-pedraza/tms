import { useTranslations } from 'next-intl';
import NotFound from '@/components/not-found';
import routes from '@/services/routes';

export default function DriverNotFound() {
  const tDrivers = useTranslations('drivers');

  return (
    <NotFound
      title={tDrivers('errors.notFound.title')}
      description={tDrivers('errors.notFound.description')}
      backHref={routes.drivers.index}
      backLabel={tDrivers('actions.backToList')}
    />
  );
}
