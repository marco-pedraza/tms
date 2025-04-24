'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import { useStateMutations } from '@/states/hooks/use-state-mutations';
import StateForm from '@/states/state-form';

export default function NewStatePage() {
  const t = useTranslations('states');
  const tCommon = useTranslations('common');
  const { createState } = useStateMutations();

  return (
    <div>
      <PageHeader
        title={t('actions.create')}
        backHref="/states"
        backLabel={t('actions.backToList')}
      />
      <StateForm
        onSubmit={createState.mutateWithToast}
        submitButtonText={tCommon('actions.create')}
      />
    </div>
  );
}
