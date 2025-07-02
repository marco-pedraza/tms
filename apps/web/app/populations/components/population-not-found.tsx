import { useTranslations } from 'next-intl';
import NotFound from '@/components/not-found';
import routes from '@/services/routes';

export default function PopulationNotFound() {
  const tPopulations = useTranslations('populations');

  return (
    <NotFound
      title={tPopulations('errors.notFound.title')}
      description={tPopulations('errors.notFound.description')}
      backHref={routes.populations.index}
      backLabel={tPopulations('actions.backToList')}
    />
  );
}
