'use client';

import { useTranslations } from 'next-intl';
import TerminalForm from '@/app/terminals/components/terminal-form';
import PageHeader from '@/components/page-header';
import useTerminalMutations from '@/terminals/hooks/use-terminal-mutations';

export default function NewTerminalPage() {
  const { createTerminal } = useTerminalMutations();
  const t = useTranslations('terminals');
  const tCommon = useTranslations('common');

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('new.title')}
        description={t('new.description')}
        backHref="/terminals"
      />

      <TerminalForm
        onSubmit={createTerminal.mutateWithToast}
        submitButtonText={tCommon('actions.create')}
      />
    </div>
  );
}
