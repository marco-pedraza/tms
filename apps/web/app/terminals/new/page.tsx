'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';
import TerminalForm from '@/terminals/components/terminal-form';
import useTerminalMutations from '@/terminals/hooks/use-terminal-mutations';

export default function NewTerminalPage() {
  const { createTerminal } = useTerminalMutations();
  const t = useTranslations('terminals');

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('new.title')}
        description={t('new.description')}
        backHref={routes.terminals.index}
      />

      <TerminalForm onSubmit={createTerminal.mutateWithToast} />
    </div>
  );
}
