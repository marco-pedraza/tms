'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import routes from '@/services/routes';
import TerminalForm from '@/terminals/components/terminal-form';
import type { TerminalFormValues } from '@/terminals/components/terminal-form/terminal-form-schemas';
import TerminalSkeleton from '@/terminals/components/terminal-skeleton';
import useQueryTerminal from '@/terminals/hooks/use-query-terminal';
import useTerminalDetailsParams from '@/terminals/hooks/use-terminal-details-params';
import useTerminalMutations from '@/terminals/hooks/use-terminal-mutations';

export default function EditTerminalPage() {
  const t = useTranslations('terminals');
  const { terminalId, isValidId } = useTerminalDetailsParams();
  const { data: terminal, isLoading } = useQueryTerminal({
    terminalId,
    enabled: isValidId,
  });
  const { updateTerminal } = useTerminalMutations();

  const handleSubmit = async (values: TerminalFormValues) => {
    await updateTerminal.mutateWithToast({ id: terminalId, values });
  };

  if (isLoading) {
    return <TerminalSkeleton />;
  }

  if (!terminal) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('edit.title')}
        description={terminal.name}
        backHref={routes.terminals.getDetailsRoute(terminalId.toString())}
      />
      <TerminalForm defaultValues={terminal} onSubmit={handleSubmit} />
    </div>
  );
}
