'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';
import StateForm from '@/states/components/state-form';
import useStateMutations from '@/states/hooks/use-state-mutations';

export default function NewStatePage() {
  const t = useTranslations('states');
  const { create: createState } = useStateMutations();

  return (
    <div>
      <PageHeader
        title={t('actions.create')}
        backHref={routes.states.index}
        backLabel={t('actions.backToList')}
      />
      <StateForm onSubmit={createState.mutateWithToast} />
    </div>
  );
}
