'use client';

import { useTranslations } from 'next-intl';
import ChromaticForm from '@/chromatics/components/chromatic-form';
import type { ChromaticFormValues } from '@/chromatics/components/chromatic-form';
import useChromaticMutations from '@/chromatics/hooks/use-chromatic-mutations';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';

export default function NewChromaticPage() {
  const t = useTranslations('chromatics');
  const { create: createChromatic } = useChromaticMutations();

  const handleSubmit = (values: ChromaticFormValues) =>
    createChromatic.mutateWithToast(values);

  return (
    <div>
      <PageHeader
        title={t('actions.create')}
        backHref={routes.chromatics.index}
        backLabel={t('actions.backToList')}
      />
      <ChromaticForm onSubmit={handleSubmit} />
    </div>
  );
}
