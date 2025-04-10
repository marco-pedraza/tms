'use client';

import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/ui-components';
import StateForm from '@/app/states/state-form';
import { useStateMutations } from '../hooks/use-state-mutations';

export default function NewStatePage() {
  const { t } = useTranslation('states');
  const { createState } = useStateMutations();

  return (
    <div>
      <PageHeader title={t('form.title')} backHref="/states" />
      <StateForm
        onSubmit={createState.mutateWithToast}
        submitButtonText={t('actions.create')}
      />
    </div>
  );
}
