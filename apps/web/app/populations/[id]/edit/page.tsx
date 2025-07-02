'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import PopulationForm, {
  PopulationFormValues,
} from '@/populations/components/population-form';
import PopulationFormSkeleton from '@/populations/components/population-form-skeleton';
import usePopulationDetailsParams from '@/populations/hooks/use-population-details-params';
import usePopulationMutations from '@/populations/hooks/use-population-mutations';
import useQueryPopulation from '@/populations/hooks/use-query-population';
import routes from '@/services/routes';

export default function EditPopulationPage() {
  const tPopulations = useTranslations('populations');
  const { populationId, isValidId } = usePopulationDetailsParams();
  const { data, isLoading } = useQueryPopulation({
    populationId,
    enabled: isValidId,
  });
  const { update: updatePopulation } = usePopulationMutations();

  const handleSubmit = (values: PopulationFormValues) => {
    return updatePopulation.mutateWithToast({ id: populationId, values });
  };

  if (isLoading) {
    return <PopulationFormSkeleton />;
  }

  if (!data) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={tPopulations('edit.title')}
        description={data.name}
        backHref={routes.populations.index}
      />
      <PopulationForm
        defaultValues={{
          ...data,
          description: data.description ?? '',
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
