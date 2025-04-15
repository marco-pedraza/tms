'use client';

import { PageHeader } from '@/components/ui-components';
import CityForm from '../city-form';
import { useCityMutations } from '../hooks/use-city-mutations';

export default function NewCityPage() {
  const { createCity } = useCityMutations();

  return (
    <div>
      <PageHeader
        title="Create New City"
        description="Add a new city to the system"
        backHref="/cities"
      />

      <CityForm onSubmit={createCity.mutateWithToast} />
    </div>
  );
}
