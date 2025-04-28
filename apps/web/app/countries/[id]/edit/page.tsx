'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import CountryForm, {
  CountryFormValues,
} from '@/countries/components/country-form';
import useCountryDetailsParams from '@/countries/hooks/use-country-details-params';
import { useCountryMutations } from '@/countries/hooks/use-country-mutations';
import useQueryCountry from '@/countries/hooks/use-query-country';

export default function EditCountryPage() {
  const tCountries = useTranslations('countries');
  const tCommon = useTranslations('common');
  const { countryId, isValidId } = useCountryDetailsParams();
  const { data, status } = useQueryCountry({
    countryId,
    enabled: isValidId,
  });
  const { updateCountry } = useCountryMutations();

  if (status === 'pending') {
    return <div>{tCommon('states.loading')}</div>;
  }

  const handleSubmit = (values: CountryFormValues) => {
    return updateCountry.mutateWithToast({ id: countryId, values });
  };

  return (
    <div>
      <PageHeader
        title={tCountries('details.description')}
        description={`${data?.name} (${data?.code})`}
        backHref="/countries"
      />
      <CountryForm
        defaultValues={data}
        onSubmit={handleSubmit}
        submitButtonText={tCommon('actions.update')}
      />
    </div>
  );
}
