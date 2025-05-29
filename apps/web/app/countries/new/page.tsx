'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import CountryForm from '@/countries/components/country-form';
import useCountryMutations from '@/countries/hooks/use-country-mutations';
import routes from '@/services/routes';

export default function NewCountryPage() {
  const t = useTranslations('countries');
  const { createCountry } = useCountryMutations();

  return (
    <div>
      <PageHeader
        title={t('actions.create')}
        backHref={routes.countries.index}
        backLabel={t('actions.backToList')}
      />
      <CountryForm onSubmit={createCountry.mutateWithToast} />
    </div>
  );
}
