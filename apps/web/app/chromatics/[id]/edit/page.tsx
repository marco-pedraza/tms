'use client';

import { useTranslations } from 'next-intl';
import ChromaticForm, {
  ChromaticFormValues,
} from '@/chromatics/components/chromatic-form';
import ChromaticFormSkeleton from '@/chromatics/components/chromatic-form-skeleton';
import useChromaticMutations from '@/chromatics/hooks/use-chromatic-mutations';
import useQueryChromatic from '@/chromatics/hooks/use-query-chromatic';
import PageHeader from '@/components/page-header';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import routes from '@/services/routes';

export default function EditChromaticPage() {
  const tChromatics = useTranslations('chromatics');
  const { itemId: chromaticId, isValidId } = useCollectionItemDetailsParams();
  const { data, isLoading } = useQueryChromatic({
    itemId: chromaticId,
    enabled: isValidId,
  });
  const { update: updateChromatic } = useChromaticMutations();

  const handleSubmit = (values: ChromaticFormValues) =>
    updateChromatic.mutateWithToast({
      id: chromaticId,
      values,
    });

  if (isLoading) {
    return <ChromaticFormSkeleton />;
  }

  if (!data) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={tChromatics('edit.title')}
        description={data?.name}
        backHref={routes.chromatics.index}
      />
      <ChromaticForm defaultValues={data} onSubmit={handleSubmit} />
    </div>
  );
}
