'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';
import StateForm, { StateFormValues } from '@/states/components/state-form';
import StateFormSkeleton from '@/states/components/state-form-skeleton';
import useQueryState from '@/states/hooks/use-query-state';
import useStateDetailsParams from '@/states/hooks/use-state-details-params';
import useStateMutations from '@/states/hooks/use-state-mutations';

export default function EditStatePage() {
  const tStates = useTranslations('states');
  const tCommon = useTranslations('common');
  const { stateId, isValidId } = useStateDetailsParams();
  const { data, isLoading } = useQueryState({
    stateId,
    enabled: isValidId,
  });
  const { updateState } = useStateMutations();

  const handleSubmit = (values: StateFormValues) => {
    return updateState.mutateWithToast({ id: stateId, values });
  };

  if (isLoading) {
    return <StateFormSkeleton />;
  }

  if (!data) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={tStates('edit.title')}
        description={`${data?.name} (${data?.code})`}
        backHref={routes.states.getDetailsRoute(stateId.toString())}
      />
      <StateForm
        defaultValues={data}
        onSubmit={handleSubmit}
        submitButtonText={tCommon('actions.update')}
      />
    </div>
  );
}
