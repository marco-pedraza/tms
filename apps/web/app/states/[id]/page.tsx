'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/page-header';
import ActionButtons from '@/components/action-buttons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import imsClient from '@/lib/imsClient';
import { isAPIError } from '@repo/ims-client';
import type { states } from '@repo/ims-client';
import NotFound from '@/components/not-found';
import { useStateMutations } from '@/app/states/hooks/use-state-mutations';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';

type State = states.State;

export default function StateDetailsPage() {
  const tStates = useTranslations('states');
  const tCommon = useTranslations('common');

  const params = useParams();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const stateId = parseInt(params.id as string, 10);
  const { deleteState } = useStateMutations();

  const {
    data: state,
    isLoading: isLoadingState,
    error: stateError,
  } = useQuery({
    queryKey: ['state', stateId],
    queryFn: async () => await imsClient.inventory.getState(stateId),
    initialData: () =>
      queryClient
        .getQueryData<states.PaginatedStates>(['states'])
        ?.data.find((state) => state.id === stateId),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState<State[]>(['states'])?.dataUpdatedAt,
  });

  const { data: country, isLoading: isLoadingCountry } = useQuery({
    queryKey: ['country', state?.countryId],
    queryFn: async () => {
      if (!state?.countryId) return null;
      return await imsClient.inventory.getCountry(state.countryId);
    },
    enabled: !!state?.countryId,
  });

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteState.mutateWithToast(stateId);
    setIsDeleteDialogOpen(false);
  };

  if (isLoadingState || isLoadingCountry) {
    return <div>{tCommon('states.loading')}</div>;
  }

  if (stateError && isAPIError(stateError) && stateError.code === 'not_found') {
    return (
      <NotFound
        title={tStates('errors.notFound.title')}
        description={tStates('errors.notFound.description')}
        backHref="/states"
        backLabel={tStates('actions.backToList')}
      />
    );
  }

  if (!state) {
    return <div>{tCommon('errors.unexpected')}</div>;
  }

  return (
    <div>
      <PageHeader
        title={state.name}
        description={tStates('details.description')}
        backHref="/states"
      />

      <div className="flex justify-end mb-6">
        <ActionButtons
          editHref={`/states/${state.id}/edit`}
          onDelete={handleDelete}
          editLabel={tCommon('actions.edit')}
          deleteLabel={tCommon('actions.delete')}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{tCommon('sections.basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{tCommon('fields.name')}:</dt>
              <dd>{state.name}</dd>

              <dt className="font-medium">{tCommon('fields.code')}:</dt>
              <dd>{state.code}</dd>

              <dt className="font-medium">{tStates('form.country')}:</dt>
              <dd>
                {country ? (
                  <span>
                    {country.name} ({country.code})
                  </span>
                ) : (
                  state.countryId
                )}
              </dd>

              <dt className="font-medium">{tCommon('fields.status')}:</dt>
              <dd>
                {state.active ? (
                  <Badge variant="outline" className="bg-green-100">
                    {tCommon('status.active')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-100">
                    {tCommon('status.inactive')}
                  </Badge>
                )}
              </dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tCommon('sections.systemInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{tCommon('fields.id')}:</dt>
              <dd>{state.id}</dd>

              <dt className="font-medium">{tCommon('fields.createdAt')}:</dt>
              <dd>{new Date(state.createdAt ?? '').toLocaleString()}</dd>

              <dt className="font-medium">{tCommon('fields.updatedAt')}:</dt>
              <dd>{new Date(state.updatedAt ?? '').toLocaleString()}</dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
