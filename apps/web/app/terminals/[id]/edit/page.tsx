'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import TerminalForm, {
  type TerminalFormValues,
} from '@/app/terminals/components/terminal-form';
import PageHeader from '@/components/page-header';
import imsClient from '@/lib/ims-client';
import useTerminalMutations from '@/terminals/hooks/use-terminal-mutations';

export default function EditTerminalPage() {
  const t = useTranslations('terminals');
  const tCommon = useTranslations('common');
  const params = useParams();
  const terminalId = Number(params.id);
  const { updateTerminal } = useTerminalMutations();

  // Get terminal data
  const {
    data: terminal,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['terminals', terminalId],
    queryFn: async () => {
      return await imsClient.inventory.getTerminal(terminalId);
    },
    enabled: !!terminalId,
  });

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

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('edit.title')}
        description={t('edit.description')}
        backHref={`/terminals/${terminalId}`}
      />

      {isLoading ? (
        <div className="text-center p-8">{tCommon('states.loading')}</div>
      ) : error ? (
        <div className="text-center p-8 text-destructive">
          {tCommon('errors.default')}
        </div>
      ) : (
        <TerminalForm
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          submitButtonText={tCommon('actions.update')}
        />
      )}
    </div>
  );
}
