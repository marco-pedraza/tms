import { useTranslations } from 'next-intl';
import NotFound from '@/components/not-found';
import routes from '@/services/routes';

export default function InstallationTypeNotFound() {
  const tInstallationTypes = useTranslations('installationTypes');

  return (
    <NotFound
      title={tInstallationTypes('errors.notFound.title')}
      description={tInstallationTypes('errors.notFound.description')}
      backHref={routes.installationTypes.index}
      backLabel={tInstallationTypes('actions.backToList')}
    />
  );
}
