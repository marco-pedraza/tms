'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import PopulationForm from '@/populations/components/population-form';
import usePopulationMutations from '@/populations/hooks/use-population-mutations';
import routes from '@/services/routes';

export default function NewPopulationPage() {
  const t = useTranslations('populations');
  const { create: createPopulation } = usePopulationMutations();

  return (
    <div>
      <PageHeader
        title={t('actions.create')}
        description={t('description')}
        backHref={routes.populations.index}
        backLabel={t('actions.backToList')}
      />
      <PopulationForm onSubmit={createPopulation.mutateWithToast} />
    </div>
  );
}
