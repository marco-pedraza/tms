import { useTranslations } from 'next-intl';
import NotFound from '@/components/not-found';
import routes from '@/services/routes';

export default function CityNotFound() {
  const tCities = useTranslations('cities');

  return (
    <NotFound
      title={tCities('errors.notFound.title')}
      description={tCities('errors.notFound.description')}
      backHref={routes.cities.index}
      backLabel={tCities('actions.backToList')}
    />
  );
}
