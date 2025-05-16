'use client';

import { useTranslations } from 'next-intl';
import LoadError from '@/components/load-error';
import routes from '@/services/routes';
import TerminalNotFound from '@/terminals/components/terminal-not-found';
import useQueryTerminal from '@/terminals/hooks/use-query-terminal';
import useTerminalDetailsParams from '@/terminals/hooks/use-terminal-details-params';

export default function TerminalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tTerminals = useTranslations('terminals');
  const { terminalId, isValidId } = useTerminalDetailsParams();
  const { status, error } = useQueryTerminal({
    terminalId,
    enabled: isValidId,
  });
  const isTerminalNotFound = !isValidId || error?.code === 'not_found';

  if (isTerminalNotFound) {
    return <TerminalNotFound />;
  }

  if (status === 'error') {
    return (
      <LoadError
        backHref={routes.terminals.index}
        backLabel={tTerminals('actions.backToList')}
      />
    );
  }

  return children;
}
