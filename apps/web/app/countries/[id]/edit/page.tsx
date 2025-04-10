'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/ui-components';
import { Params } from 'next/dist/server/request/params';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import imsClient from '@/lib/imsClient';
import type { countries } from '@repo/ims-client';
import CountryForm, { CountryFormValues } from '@/app/countries/country-form';
import { useCountryMutations } from '@/app/countries/hooks/use-country-mutations';

interface EditCountryPageParams extends Params {
  id: string;
}

const isNumber = (value: string) => {
  return !isNaN(Number(value));
};

export default function EditCountryPage() {
  const params = useParams<EditCountryPageParams>();
  const countryId = parseInt(params.id);
  const queryClient = useQueryClient();
  const { updateCountry } = useCountryMutations();
  const { data, status, error } = useQuery({
    queryKey: ['country', countryId],
    enabled: isNumber(params.id),
    queryFn: () => imsClient.inventory.getCountry(countryId),
    initialData: () =>
      queryClient
        ?.getQueryData<countries.PaginatedCountries>(['countries'])
        ?.data.find((country) => country.id === countryId),
    initialDataUpdatedAt: () =>
      queryClient?.getQueryState<countries.Country[]>(['countries'])
        ?.dataUpdatedAt,
  });

  if (!isNumber(params.id)) {
    return <div>Invalid country ID</div>;
  }

  if (status === 'pending') {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const handleSubmit = (values: CountryFormValues) => {
    return updateCountry.mutateWithToast({ id: countryId, values });
  };

  return (
    <div>
      <PageHeader
        title="Detalles del país"
        description={`${data?.name} (${data?.code})`}
        backHref="/countries"
      />
      <CountryForm
        defaultValues={data}
        onSubmit={handleSubmit}
        submitButtonText="Actualizar"
      />
    </div>
  );
}
