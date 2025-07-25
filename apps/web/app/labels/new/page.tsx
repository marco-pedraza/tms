'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import LabelForm from '@/labels/components/label-form';
import useLabelMutations from '@/labels/hooks/use-label-mutations';
import routes from '@/services/routes';

export default function NewLabelPage() {
  const t = useTranslations('labels');
  const { create: createLabel } = useLabelMutations();

  return (
    <div>
      <PageHeader
        title={t('actions.create')}
        backHref={routes.labels.index}
        backLabel={t('actions.backToList')}
      />
      <LabelForm onSubmit={createLabel.mutateWithToast} />
    </div>
  );
}
