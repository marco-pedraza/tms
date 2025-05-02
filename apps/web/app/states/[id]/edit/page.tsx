'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import StateForm, { StateFormValues } from '@/states/components/state-form';
import StateFormSkeleton from '@/states/components/state-form-skeleton';
import { useQueryState } from '@/states/hooks/use-query-state';
import useStateDetailsParams from '@/states/hooks/use-state-details-params';
import { useStateMutations } from '@/states/hooks/use-state-mutations';

export default function EditStatePage() {
  const { stateId, isValidId } = useStateDetailsParams();
  const { updateState } = useStateMutations();
  const tStates = useTranslations('states');
  const tCommon = useTranslations('common');

  const { data, status } = useQueryState({
    stateId,
    enabled: isValidId,
  });

  if (status === 'pending') {
    return <StateFormSkeleton />;
  }

  const handleSubmit = (values: StateFormValues) => {
    const numericId = parseInt(stateId, 10);
    return updateState.mutateWithToast({ id: numericId, values });
  };

  return (
    <div>
      <PageHeader
        title={tStates('edit.title')}
        description={`${data?.name} (${data?.code})`}
        backHref={`/states/${stateId}`}
      />
      <StateForm
        defaultValues={data}
        onSubmit={handleSubmit}
        submitButtonText={tCommon('actions.update')}
        isSubmitting={updateState.isPending}
      />
    </div>
  );
}
