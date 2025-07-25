'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import LabelForm, { LabelFormValues } from '@/labels/components/label-form';
import LabelFormSkeleton from '@/labels/components/label-form-skeleton';
import useLabelMutations from '@/labels/hooks/use-label-mutations';
import useQueryLabel from '@/labels/hooks/use-query-label';
import routes from '@/services/routes';

export default function EditLabelPage() {
  const tLabels = useTranslations('labels');
  const { itemId: labelId, isValidId } = useCollectionItemDetailsParams();
  const { data, isLoading } = useQueryLabel({
    itemId: labelId,
    enabled: isValidId,
  });
  const { update: updateLabel } = useLabelMutations();

  const handleSubmit = async (values: LabelFormValues) => {
    const apiValues = {
      ...values,
      description: values.description ?? '',
    };
    await updateLabel.mutateWithToast({ id: labelId, values: apiValues });
  };

  if (isLoading) {
    return <LabelFormSkeleton />;
  }

  if (!data) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={tLabels('edit.title')}
        description={`${data?.name}`}
        backHref={routes.labels.index}
      />
      <LabelForm
        defaultValues={{
          ...data,
          description: data.description ?? '',
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
