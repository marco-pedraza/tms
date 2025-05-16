import { useTranslations } from 'next-intl';
import NotFound from '@/components/not-found';
import routes from '@/services/routes';

export default function CountryNotFound() {
  const tCountries = useTranslations('countries');

  return (
    <NotFound
      title={tCountries('errors.notFound.title')}
      description={tCountries('errors.notFound.description')}
      backHref={routes.countries.index}
      backLabel={tCountries('actions.backToList')}
    />
  );
}
