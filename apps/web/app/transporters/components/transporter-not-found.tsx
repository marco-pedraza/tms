import { useTranslations } from 'next-intl';
import NotFound from '@/components/not-found';
import routes from '@/services/routes';

/**
 * Component displayed when a transporter is not found or doesn't exist.
 */
export default function TransporterNotFound() {
  const tTransporters = useTranslations('transporters');

  return (
    <NotFound
      title={tTransporters('errors.notFound.title')}
      description={tTransporters('errors.notFound.description')}
      backHref={routes.transporters.index}
      backLabel={tTransporters('actions.backToList')}
    />
  );
}
