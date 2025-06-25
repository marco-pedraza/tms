'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import CountryForm, {
  CountryFormValues,
} from '@/countries/components/country-form';
import CountryFormSkeleton from '@/countries/components/country-form-skeleton';
import useCountryDetailsParams from '@/countries/hooks/use-country-details-params';
import useCountryMutations from '@/countries/hooks/use-country-mutations';
import useQueryCountry from '@/countries/hooks/use-query-country';
import routes from '@/services/routes';

export default function EditCountryPage() {
  const tCountries = useTranslations('countries');
  const { countryId, isValidId } = useCountryDetailsParams();
  const { data, isLoading } = useQueryCountry({
    countryId,
    enabled: isValidId,
  });
  const { update: updateCountry } = useCountryMutations();

  const handleSubmit = (values: CountryFormValues) =>
    updateCountry.mutateWithToast({ id: countryId, values });

  if (isLoading) {
    return <CountryFormSkeleton />;
  }

  if (!data) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={tCountries('details.description')}
        description={`${data?.name} (${data?.code})`}
        backHref={routes.countries.index}
      />
      <CountryForm defaultValues={data} onSubmit={handleSubmit} />
    </div>
  );
}
