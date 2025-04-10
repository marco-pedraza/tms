'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';
import { PageHeader, ActionButtons } from '@/components/ui-components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import imsClient from '@/lib/imsClient';
import { isAPIError } from '@repo/ims-client';
import type { states } from '@repo/ims-client';
import NotFound from '@/components/ui-components/not-found';
import { useStateMutations } from '@/app/states/hooks/use-state-mutations';

type State = states.State;

export default function StateDetailsPage() {
  const { t } = useTranslation(['states', 'common']);
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
    return <div>{t('common:states.loading')}</div>;
  }

  if (stateError && isAPIError(stateError) && stateError.code === 'not_found') {
    return (
      <NotFound
        title={t('states:errors.notFound.title')}
        description={t('states:errors.notFound.description')}
        backHref="/states"
        backLabel={t('states:actions.backToList')}
      />
    );
  }

  if (!state) {
    return <div>{t('common:errors.unexpected')}</div>;
  }

  return (
    <div>
      <PageHeader
        title={state.name}
        description={t('states:details.description')}
        backHref="/states"
      />

      <div className="flex justify-end mb-6">
        <ActionButtons
          editHref={`/states/${state.id}/edit`}
          onDelete={handleDelete}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('common:sections.basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{t('common:fields.name')}:</dt>
              <dd>{state.name}</dd>

              <dt className="font-medium">{t('common:fields.code')}:</dt>
              <dd>{state.code}</dd>

              <dt className="font-medium">{t('states:form.country')}:</dt>
              <dd>
                {country ? (
                  <span>
                    {country.name} ({country.code})
                  </span>
                ) : (
                  state.countryId
                )}
              </dd>

              <dt className="font-medium">{t('common:fields.status')}:</dt>
              <dd>
                {state.active ? (
                  <Badge variant="outline" className="bg-green-100">
                    {t('common:status.active')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-100">
                    {t('common:status.inactive')}
                  </Badge>
                )}
              </dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('common:sections.systemInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{t('common:fields.id')}:</dt>
              <dd>{state.id}</dd>

              <dt className="font-medium">{t('common:fields.createdAt')}:</dt>
              <dd>{new Date(state.createdAt ?? '').toLocaleString()}</dd>

              <dt className="font-medium">{t('common:fields.updatedAt')}:</dt>
              <dd>{new Date(state.updatedAt ?? '').toLocaleString()}</dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('common:crud.delete.confirm')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('common:crud.delete.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {t('common:actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
