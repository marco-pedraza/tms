'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import CountryForm from '@/app/countries/country-form';
import { useCountryMutations } from '../hooks/use-country-mutations';

export default function NewCountryPage() {
  const t = useTranslations('countries');
  const tCommon = useTranslations('common');
  const { createCountry } = useCountryMutations();

  return (
    <div>
      <PageHeader
        title={t('actions.create')}
        backHref="/countries"
        backLabel={t('actions.backToList')}
      />
      <CountryForm
        onSubmit={createCountry.mutateWithToast}
        submitButtonText={tCommon('actions.create')}
      />
    </div>
  );
}
