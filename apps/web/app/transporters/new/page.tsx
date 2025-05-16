'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/page-header';
import TransporterForm from '@/transporters/components/transporter-form';
import useTransporterMutations from '@/transporters/hooks/use-transporter-mutations';

export default function NewTransporterPage() {
  const t = useTranslations('transporters');
  const tCommon = useTranslations('common');
  const { createTransporter } = useTransporterMutations();

  return (
    <div>
      <PageHeader
        title={t('actions.create')}
        backHref="/transporters"
        backLabel={t('actions.backToList')}
      />
      <TransporterForm
        onSubmit={createTransporter.mutateWithToast}
        submitButtonText={tCommon('actions.create')}
      />
    </div>
  );
}
