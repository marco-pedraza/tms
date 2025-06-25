'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import ActionButtons from '@/components/action-buttons';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useQueryCountry from '@/countries/hooks/use-query-country';
import routes from '@/services/routes';
import StateSkeleton from '@/states/components/state-skeleton';
import useQueryState from '@/states/hooks/use-query-state';
import useStateDetailsParams from '@/states/hooks/use-state-details-params';
import useStateMutations from '@/states/hooks/use-state-mutations';

export default function StateDetailsPage() {
  const tStates = useTranslations('states');
  const tCommon = useTranslations('common');
  const { stateId, isValidId } = useStateDetailsParams();
  const { data: state, isLoading } = useQueryState({
    stateId,
    enabled: isValidId,
  });
  const { data: country } = useQueryCountry({
    countryId: state?.countryId ?? -1,
    enabled: !!state?.countryId,
  });
  const { delete: deleteState } = useStateMutations();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteState.mutateWithToast(stateId);
    setIsDeleteDialogOpen(false);
  };

  if (isLoading) {
    return <StateSkeleton />;
  }

  if (!state) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={state.name}
        description={tStates('details.description')}
        backHref={routes.states.index}
      />

      <div className="flex justify-end mb-6">
        <ActionButtons
          editHref={routes.states.getEditRoute(state.id.toString())}
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
