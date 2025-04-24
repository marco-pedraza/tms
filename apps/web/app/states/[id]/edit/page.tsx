'use client';

import { useParams } from 'next/navigation';
import PageHeader from '@/components/page-header';
import { Params } from 'next/dist/server/request/params';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import imsClient from '@/lib/ims-client';
import type { states } from '@repo/ims-client';
import StateForm, { StateFormValues } from '@/app/states/state-form';
import { useStateMutations } from '@/app/states/hooks/use-state-mutations';
import { useTranslations } from 'next-intl';

interface EditStatePageParams extends Params {
  id: string;
}

const isNumber = (value: string) => {
  return !isNaN(Number(value));
};

export default function EditStatePage() {
  const params = useParams<EditStatePageParams>();
  const stateId = parseInt(params.id);
  const queryClient = useQueryClient();
  const { updateState } = useStateMutations();
  const tStates = useTranslations('states');
  const tCommon = useTranslations('common');

  const { data, status, error } = useQuery({
    queryKey: ['state', stateId],
    enabled: isNumber(params.id),
    queryFn: () => imsClient.inventory.getState(stateId),
    initialData: () =>
      queryClient
        .getQueryData<states.PaginatedStates>(['states'])
        ?.data.find((state) => state.id === stateId),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState<states.State[]>(['states'])?.dataUpdatedAt,
  });

  if (!isNumber(params.id)) {
    return <div>{tCommon('errors.invalidId')}</div>;
  }

  if (status === 'pending') {
    return <div>{tCommon('states.loading')}</div>;
  }

  if (error) {
    return <div>{tCommon('errors.unexpected')}</div>;
  }

  const handleSubmit = (values: StateFormValues) => {
    return updateState.mutateWithToast({ id: stateId, values });
  };

  return (
    <div>
      <PageHeader
        title={tStates('edit.title')}
        description={`${data?.name} (${data?.code})`}
        backHref="/states"
      />
      <StateForm
        defaultValues={data}
        onSubmit={handleSubmit}
        submitButtonText={tCommon('actions.update')}
      />
    </div>
  );
}
