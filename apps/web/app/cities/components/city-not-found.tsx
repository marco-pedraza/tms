import { useTranslations } from 'next-intl';
import NotFound from '@/components/not-found';

export default function CityNotFound() {
  const tCities = useTranslations('cities');

  return (
    <NotFound
      title={tCities('errors.notFound.title')}
      description={tCities('errors.notFound.description')}
      backHref="/cities"
      backLabel={tCities('actions.backToList')}
    />
  );
}
