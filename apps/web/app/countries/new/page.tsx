'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui-components';
import imsClient from '@/lib/imsClient';
import CountryForm, { CountryFormValues } from '@/app/countries/country-form';

export default function NewCountryPage() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const createCountryMutation = useMutation({
    mutationFn: async (values: CountryFormValues) =>
      await imsClient.inventory.createCountry(values),
    onSuccess: (data) => {
      toast.success('País creado correctamente');
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      router.push(`/countries/${data.id}`);
    },
    onError: (error) => {
      toast.error('No pudimos crear el país', {
        description: error.message,
      });
    },
  });

  return (
    <div>
      <PageHeader title="Nuevo país" backHref="/countries" />
      <CountryForm
        onSubmit={createCountryMutation.mutateAsync}
        submitButtonText="Crear"
      />
    </div>
  );
}
