'use client';

import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui-components';
import { Params } from 'next/dist/server/request/params';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import imsClient from '@/lib/imsClient';
import type { countries } from '@repo/ims-client';
import CountryForm, { CountryFormValues } from '@/app/countries/country-form';

interface EditCountryPageParams extends Params {
  id: string;
}

const isNumber = (value: string) => {
  return !isNaN(Number(value));
};

export default function EditCountryPage() {
  const params = useParams<EditCountryPageParams>();
  const router = useRouter();
  const countryId = params.id;
  const queryClient = useQueryClient();
  const { data, status, error } = useQuery({
    queryKey: ['country', countryId],
    enabled: isNumber(countryId),
    queryFn: () => imsClient.inventory.getCountry(Number(countryId)),
    initialData: () =>
      queryClient
        ?.getQueryData<countries.PaginatedCountries>(['countries'])
        ?.data.find((country) => country.id === Number(countryId)),
    initialDataUpdatedAt: () =>
      queryClient?.getQueryState<countries.Country[]>(['countries'])
        ?.dataUpdatedAt,
  });

  const updateCountryMutation = useMutation({
    mutationFn: async (values: CountryFormValues) =>
      await imsClient.inventory.updateCountry(Number(countryId), values),
    onSuccess: () => {
      toast.success('País actualizado correctamente');
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      router.push(`/countries/${countryId}`);
    },
    onError: (error) => {
      toast.error('No pudimos actualizar el país', {
        description: error.message,
      });
    },
  });

  if (!isNumber(countryId)) {
    return <div>Invalid country ID</div>;
  }

  if (status === 'pending') {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <PageHeader
        title="Detalles del país"
        description={`${data?.name} (${data?.code})`}
        backHref="/countries"
      />
      <CountryForm
        defaultValues={data}
        onSubmit={updateCountryMutation.mutateAsync}
        submitButtonText="Actualizar"
      />
    </div>
  );
}
