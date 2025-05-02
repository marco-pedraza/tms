'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import ActionButtons from '@/components/action-buttons';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import imsClient from '@/lib/ims-client';
import StateSkeleton from '@/states/components/state-skeleton';
import { useQueryState } from '@/states/hooks/use-query-states';
import useStateDetailsParams from '@/states/hooks/use-state-details-params';
import { useStateMutations } from '@/states/hooks/use-state-mutations';

export default function StateDetailsPage() {
  const tStates = useTranslations('states');
  const tCommon = useTranslations('common');

  const { stateId } = useStateDetailsParams();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { deleteState } = useStateMutations();

  const { data: state, status } = useQueryState({ stateId });

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
    const numericId = parseInt(stateId, 10);
    deleteState.mutateWithToast(numericId);
    setIsDeleteDialogOpen(false);
  };

  if (status === 'pending' || isLoadingCountry) {
    return <StateSkeleton />;
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
