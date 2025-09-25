'use client';

import { useTranslations } from 'next-intl';
import PathwayForm, {
  type PathwayFormValues,
} from '@/app/pathways/components/pathway-form';
import PageHeader from '@/components/page-header';
import usePathwayMutations from '@/pathways/hooks/use-pathway-mutations';
import routes from '@/services/routes';

export default function NewPathwayPage() {
  const t = useTranslations('pathways');
  const { create: createPathway } = usePathwayMutations();

  const handleSubmit = (values: PathwayFormValues) =>
    createPathway.mutateWithToast({
      ...values,
    });
  return (
    <div>
      <PageHeader
        title={t('actions.create')}
        backHref={routes.pathways.index}
        backLabel={t('actions.backToList')}
      />
      <PathwayForm onSubmit={handleSubmit} />
    </div>
  );
}
