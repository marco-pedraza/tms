'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import TerminalForm, {
  type TerminalFormValues,
} from '@/terminals/components/terminal-form';
import TerminalSkeleton from '@/terminals/components/terminal-skeleton';
import useQueryTerminal from '@/terminals/hooks/use-query-terminal';
import useTerminalDetailsParams from '@/terminals/hooks/use-terminal-details-params';
import useTerminalMutations from '@/terminals/hooks/use-terminal-mutations';

export default function EditTerminalPage() {
  const t = useTranslations('terminals');
  const tCommon = useTranslations('common');
  const { terminalId, isValidId } = useTerminalDetailsParams();
  const { data: terminal, isLoading } = useQueryTerminal({
    terminalId,
    enabled: isValidId,
  });
  const { updateTerminal } = useTerminalMutations();

  // Prepare default values for the form
  const defaultValues = terminal
    ? {
        name: terminal.name,
        code: terminal.code,
        address: terminal.address,
        cityId: terminal.cityId,
        latitude: terminal.latitude,
        longitude: terminal.longitude,
        contactphone: terminal.contactphone ?? '',
        active: terminal.active,
        facilities: terminal.facilities ?? [],
        operatingHours: terminal.operatingHours ?? {},
      }
    : undefined;

  const handleSubmit = (values: TerminalFormValues) => {
    return updateTerminal.mutateWithToast({ id: terminalId, values });
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
        description={t('edit.description')}
        backHref={`/terminals/${terminalId}`}
      />
      <TerminalForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        submitButtonText={tCommon('actions.update')}
      />
    </div>
  );
}
