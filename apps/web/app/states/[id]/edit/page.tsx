'use client';

import { Params } from 'next/dist/server/request/params';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { states } from '@repo/ims-client';
import PageHeader from '@/components/page-header';
import imsClient from '@/lib/ims-client';
import { useStateMutations } from '@/states/hooks/use-state-mutations';
import StateForm, { StateFormValues } from '@/states/state-form';

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
