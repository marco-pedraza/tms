'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/ui-components';
import { Params } from 'next/dist/server/request/params';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import imsClient from '@/lib/imsClient';
import type { states } from '@repo/ims-client';
import { useTranslation } from 'react-i18next';
import StateForm, { StateFormValues } from '@/app/states/state-form';
import { useStateMutations } from '@/app/states/hooks/use-state-mutations';

interface EditStatePageParams extends Params {
  id: string;
}

const isNumber = (value: string) => {
  return !isNaN(Number(value));
};

export default function EditStatePage() {
  const { t } = useTranslation(['states', 'common']);
  const params = useParams<EditStatePageParams>();
  const stateId = parseInt(params.id);
  const queryClient = useQueryClient();
  const { updateState } = useStateMutations();

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
    return <div>{t('states:errors.invalidId')}</div>;
  }

  if (status === 'pending') {
    return <div>{t('common:states.loading')}</div>;
  }

  if (error) {
    return <div>{t('common:errors.unexpected')}</div>;
  }

  const handleSubmit = (values: StateFormValues) => {
    return updateState.mutateWithToast({ id: stateId, values });
  };

  return (
    <div>
      <PageHeader
        title={t('states:edit.title')}
        description={`${data?.name} (${data?.code})`}
        backHref="/states"
      />
      <StateForm
        defaultValues={data}
        onSubmit={handleSubmit}
        submitButtonText={t('states:actions.update')}
      />
    </div>
  );
}
