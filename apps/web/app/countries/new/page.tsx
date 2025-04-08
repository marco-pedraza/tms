'use client';

import { PageHeader } from '@/components/ui-components';
import CountryForm from '@/app/countries/country-form';
import { useCountryMutations } from '../hooks/use-country-mutations';

export default function NewCountryPage() {
  const { createCountry } = useCountryMutations();

  return (
    <div>
      <PageHeader title="Nuevo país" backHref="/countries" />
      <CountryForm
        onSubmit={createCountry.mutateWithToast}
        submitButtonText="Crear"
      />
    </div>
  );
}
