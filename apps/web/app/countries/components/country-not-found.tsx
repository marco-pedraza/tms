import NotFound from '@/components/not-found';
import { useTranslations } from 'next-intl';

export default function CountryNotFound() {
  const tCountries = useTranslations('countries');

  return (
    <NotFound
      title={tCountries('errors.notFound.title')}
      description={tCountries('errors.notFound.description')}
      backHref="/countries"
      backLabel={tCountries('actions.backToList')}
    />
  );
}
